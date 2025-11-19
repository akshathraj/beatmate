import os
import re
from moviepy.editor import AudioFileClip
from difflib import SequenceMatcher
from app import config

def clean_word_for_matching(word):
    """
    Clean a word for fuzzy matching (remove punctuation, lowercase).
    """
    return re.sub(r'[^\w\s]', '', word.lower()).strip()

def detect_language_from_lyrics(lyrics_text):
    """
    Detect language from lyrics using Gemini AI.
    Works with any script (Romanized Hindi, native scripts, multilingual, etc.)
    
    Returns ISO 639-1 language code (e.g., 'hi', 'en', 'es', 'ar') or None
    """
    if not lyrics_text:
        return None
    
    try:
        from google import genai
        
        # Initialize Gemini client
        client = genai.Client(api_key=config.GEMINI_API_KEY)
        
        # Take first 300 characters (enough for detection, saves tokens)
        sample = lyrics_text[:300].strip()
        
        prompt = f"""Detect the PRIMARY language of these lyrics and return ONLY the ISO 639-1 language code.

Lyrics sample:
{sample}

Common codes: hi (Hindi), en (English), es (Spanish), ar (Arabic), fr (French), de (German), it (Italian), pt (Portuguese), ja (Japanese), ko (Korean), zh (Chinese)

Rules:
- If lyrics are Romanized (e.g., "Tere Naam" instead of "तेरे नाम"), still detect the original language
- If multilingual, return the DOMINANT language
- Return ONLY the 2-letter code, nothing else

Output (2-letter code only):"""

        # Call Gemini with minimal response
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
        
        # Parse response
        detected_code = response.text.strip().lower()
        
        # Validate it's a 2-letter code
        if len(detected_code) == 2 and detected_code.isalpha():
            print(f"[Language Detection] ✅ Detected via Gemini: {detected_code}")
            return detected_code
        else:
            print(f"[Language Detection] ⚠️ Invalid response: {detected_code}")
            return None
            
    except Exception as e:
        print(f"[Language Detection] ❌ Error: {e}")
        return None

def romanize_text(text: str, language_code: str) -> str:
    """
    Romanize non-Latin text to Latin alphabets.
    
    Args:
        text: Text in native script (e.g., Devanagari, Arabic)
        language_code: Language code (e.g., "hi", "ar")
    
    Returns:
        Romanized text in Latin alphabets
    """
    try:
        # Hindi (Devanagari) → Roman (ITRANS)
        if language_code == 'hi':
            try:
                from indic_transliteration import sanscript
                from indic_transliteration.sanscript import transliterate
                return transliterate(text, sanscript.DEVANAGARI, sanscript.ITRANS)
            except ImportError:
                print(f"[Romanization] ⚠️ indic_transliteration not installed for Hindi")
                return text
        
        # For other non-Latin languages, return as-is for now
        # Can add more transliteration libraries as needed
        else:
            return text
            
    except Exception as e:
        print(f"[Romanization] ⚠️ Error romanizing {language_code}: {e}")
        return text

def map_transcription_to_lyrics(transcribed_words, original_lyrics):
    """
    Map AssemblyAI transcribed words (with timing) to original lyrics (with formatting).
    
    Simple approach: Use original lyrics in order, with AssemblyAI's timing.
    Assumes lyrics are mostly correct and in the same order as sung.
    
    Args:
        transcribed_words: List of {"start": float, "end": float, "word": str}
        original_lyrics: Original formatted lyrics text
    
    Returns:
        List of {"start": float, "end": float, "word": str} with original formatting
    """
    print("[Mapping] 🔄 Mapping transcription timing to original lyrics...")
    
    # Parse original lyrics into words (preserving punctuation)
    original_words = []
    for line in original_lyrics.split('\n'):
        line = line.strip()
        if not line or (line.startswith('[') and line.endswith(']')):
            continue  # Skip section markers
        
        # Split line into words but keep punctuation attached
        words_in_line = line.split()
        original_words.extend(words_in_line)
    
    print(f"[Mapping] Original lyrics: {len(original_words)} words")
    print(f"[Mapping] Transcribed: {len(transcribed_words)} words")
    
    # Simple approach: Use original words with transcribed timing
    # Map 1:1 as much as possible
    mapped_words = []
    
    for i, trans_word_obj in enumerate(transcribed_words):
        if i < len(original_words):
            # Use original word with transcribed timing
            mapped_words.append({
                "start": trans_word_obj["start"],
                "end": trans_word_obj["end"],
                "word": original_words[i]  # Use original formatted word!
            })
        else:
            # If we run out of original words, use transcribed
            mapped_words.append({
                "start": trans_word_obj["start"],
                "end": trans_word_obj["end"],
                "word": trans_word_obj["word"]
            })
    
    # If original has more words than transcribed, add them at the end with estimated timing
    if len(original_words) > len(transcribed_words):
        print(f"[Mapping] ⚠️  Original has {len(original_words) - len(transcribed_words)} more words, appending with estimated timing")
        if mapped_words:
            last_end = mapped_words[-1]["end"]
            avg_duration = 0.35
            
            for i in range(len(transcribed_words), len(original_words)):
                mapped_words.append({
                    "start": last_end,
                    "end": last_end + avg_duration,
                    "word": original_words[i]
                })
                last_end += avg_duration
    
    print(f"[Mapping] ✅ Mapped {len(mapped_words)} words with original formatting")
    
    # Debug: Show first few mappings
    print(f"[Mapping] First 10 words:")
    for i, word in enumerate(mapped_words[:10]):
        print(f"  {i+1}. {word['start']:.1f}s: {word['word']}")
    
    return mapped_words

def clean_lyrics_for_alignment(lyrics_text):
    """
    Clean lyrics file for alignment.
    Removes section markers like [Intro], [Verse], etc.
    Returns clean text suitable for alignment.
    """
    # Remove section markers [Intro], [Verse], etc.
    lyrics_text = re.sub(r'\[.*?\]', '', lyrics_text)
    
    # Clean up extra whitespace and newlines
    lyrics_text = re.sub(r'\n+', '\n', lyrics_text)
    lyrics_text = lyrics_text.strip()
    
    return lyrics_text

def align_lyrics_time_based(lyrics_text, audio_duration):
    """
    Simple time-based alignment: distribute lyrics evenly across audio duration.
    Surprisingly effective for music videos!
    
    Returns list of {"start": float, "end": float, "word": "..."}.
    """
    print(f"[Time-Based Alignment] 🎵 Distributing lyrics across {audio_duration:.1f} seconds")
    
    # Split into words
    words = lyrics_text.split()
    word_count = len(words)
    
    if word_count == 0:
        print("[Time-Based Alignment] ⚠️  No words found in lyrics")
        return []
    
    # Calculate average duration per word
    # Leave small buffer at start and end (10% of duration)
    usable_duration = audio_duration * 0.9
    start_offset = audio_duration * 0.05
    avg_word_duration = usable_duration / word_count
    
    # Create timestamps
    word_fragments = []
    current_time = start_offset
    
    for word in words:
        word = word.strip()
        if not word:
            continue
            
        word_fragments.append({
            "start": current_time,
            "end": current_time + avg_word_duration,
            "word": word
        })
        current_time += avg_word_duration
    
    print(f"[Time-Based Alignment] ✅ Generated {len(word_fragments)} word timestamps")
    print(f"[Time-Based Alignment] Average word duration: {avg_word_duration:.2f}s")
    
    return word_fragments

def align_with_assemblyai(audio_path, known_lyrics=None, original_lyrics_text=None):
    """
    Use AssemblyAI to get word-level timestamps from audio.
    
    Strategy:
    - Detect language from lyrics (Gemini AI)
    - Tell Assembly AI the language for accurate transcription
    - Romanize transcription if non-Latin script
    - Map timing to original formatted words
    
    Returns list of {"start": float, "end": float, "word": "..."}.
    """
    try:
        import assemblyai as aai
        
        print("[AssemblyAI] 🎯 Using AssemblyAI for word-level timestamps...")
        
        # Configure API
        aai.settings.api_key = config.ASSEMBLYAI_API_KEY
        
        # Detect language from lyrics to help Assembly AI
        detected_lang = None
        if original_lyrics_text:
            detected_lang = detect_language_from_lyrics(original_lyrics_text)
            if detected_lang:
                print(f"[AssemblyAI] 🌐 Language hint for Assembly AI: {detected_lang}")
        
        # Configure transcription with word-level timestamps
        transcription_config = aai.TranscriptionConfig(
            speech_model=aai.SpeechModel.best,  # Use best model for accuracy
            language_code=detected_lang if detected_lang else None,  # Language hint
        )
        
        # Transcribe
        print(f"[AssemblyAI] Transcribing: {audio_path}")
        if detected_lang:
            print(f"[AssemblyAI] Using language code: {detected_lang}")
        else:
            print(f"[AssemblyAI] Auto-detecting language...")
        transcriber = aai.Transcriber(config=transcription_config)
        transcript = transcriber.transcribe(audio_path)
        
        if transcript.status == aai.TranscriptStatus.error:
            print(f"[AssemblyAI] ❌ Error: {transcript.error}")
            return None
        
        # Get word-level timestamps
        word_fragments = []
        if transcript.words:
            for word_obj in transcript.words:
                word_fragments.append({
                    "start": word_obj.start / 1000.0,  # Convert ms to seconds
                    "end": word_obj.end / 1000.0,
                    "word": word_obj.text
                })
            
            print(f"[AssemblyAI] ✅ Got {len(word_fragments)} word timestamps from transcription")
            
            # Romanize transcription if non-Latin script
            if detected_lang and detected_lang in ['hi', 'ar', 'ja', 'zh', 'ko', 'ru', 'th']:
                print(f"[AssemblyAI] 🔄 Romanizing {detected_lang} transcription to Latin script...")
                for word_obj in word_fragments:
                    word_obj['word'] = romanize_text(word_obj['word'], detected_lang)
                print(f"[AssemblyAI] ✅ Romanization complete")
            
            # Map timing to original lyrics
            if original_lyrics_text:
                print(f"[AssemblyAI] 📝 Mapping to original lyrics (preserving formatting)...")
                word_fragments = map_transcription_to_lyrics(word_fragments, original_lyrics_text)
                print(f"[AssemblyAI] ✅ Using original formatted lyrics with AssemblyAI timing!")
            else:
                print(f"[AssemblyAI] Using AssemblyAI transcription as-is")
            
            # Apply timing offset to fix sync delay (Assembly AI tends to be ~2-3s late)
            TIMING_OFFSET = -1.5  # Negative = lyrics appear earlier
            print(f"[AssemblyAI] ⏱️  Applying timing offset: {TIMING_OFFSET}s for better sync")
            for fragment in word_fragments:
                fragment['start'] = max(0, fragment['start'] + TIMING_OFFSET)
                fragment['end'] = max(0, fragment['end'] + TIMING_OFFSET)
            
            return word_fragments
        else:
            print("[AssemblyAI] ⚠️  No words found in transcription")
            return None
            
    except Exception as e:
        print(f"[AssemblyAI] ⚠️  Error: {e}")
        return None

def align_audio_with_lyrics(audio_path, lyrics_txt_path=None):
    """
    Align lyrics with audio using the best available method.
    
    Priority order:
    1. AssemblyAI (professional, accurate word-level timestamps)
    2. Time-based distribution (simple fallback)
    3. WhisperX (last resort for transcription)
    
    Returns list of {"start": float, "end": float, "word": "..."}.
    """
    
    # Read known lyrics if available
    known_lyrics = None
    original_lyrics_text = None
    
    if lyrics_txt_path and os.path.exists(lyrics_txt_path):
        print(f"[Alignment] 🎯 Found lyrics file: {lyrics_txt_path}")
        try:
            with open(lyrics_txt_path, 'r', encoding='utf-8') as f:
                original_lyrics_text = f.read().strip()  # Keep original formatting!
            known_lyrics = clean_lyrics_for_alignment(original_lyrics_text)
            print(f"[Alignment] Loaded {len(known_lyrics.split())} words from lyrics file")
        except Exception as e:
            print(f"[Alignment] ⚠️  Could not read lyrics file: {e}")
            known_lyrics = None
            original_lyrics_text = None
    
    # METHOD 1: AssemblyAI (BEST - Professional word-level timestamps) ☁️
    if known_lyrics:
        print("[Alignment] 🚀 Trying AssemblyAI with original lyrics mapping...")
        result = align_with_assemblyai(audio_path, known_lyrics, original_lyrics_text)
        if result:
            return result
        print("[Alignment] ⚠️  AssemblyAI failed, trying time-based fallback...")
    else:
        # For uploaded songs without lyrics, still try AssemblyAI for transcription
        print("[Alignment] 📝 No lyrics file, using AssemblyAI for transcription...")
        result = align_with_assemblyai(audio_path, known_lyrics=None, original_lyrics_text=None)
        if result:
            return result
        print("[Alignment] ⚠️  AssemblyAI failed, trying WhisperX fallback...")
    
    # METHOD 2: Time-Based Distribution (FALLBACK for known lyrics) 🎵
    if known_lyrics:
        print("[Alignment] Using time-based distribution as fallback...")
        try:
            audio_clip = AudioFileClip(audio_path)
            audio_duration = audio_clip.duration
            audio_clip.close()
            
            word_fragments = align_lyrics_time_based(known_lyrics, audio_duration)
            if word_fragments:
                return word_fragments
        except Exception as e:
            print(f"[Alignment] ⚠️  Time-based failed: {e}")
    
    # METHOD 3: WhisperX Transcription (LAST RESORT) 📝
    print("[WhisperX] 📝 Last resort: WhisperX transcription...")
    try:
        import whisperx
        import torch
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[WhisperX] Using device: {device}")

        model = whisperx.load_model("small", device, compute_type="float32")
        audio = whisperx.load_audio(audio_path)

        result = model.transcribe(audio)
        detected_language = result.get("language", "en")
        print(f"[WhisperX] Detected language: {detected_language}")

        align_model, metadata = whisperx.load_align_model(language_code=detected_language, device=device)
        result_aligned = whisperx.align(result["segments"], align_model, metadata, audio, device)

        word_fragments = []
        for seg in result_aligned["segments"]:
            words = seg.get("words", [])
            for word_obj in words:
                word_text = word_obj.get("word", "").strip()
                if not word_text:
                    continue
                start = float(word_obj.get("start", 0))
                end = float(word_obj.get("end", start + 0.5))
                word_fragments.append({
                    "start": start,
                    "end": end,
                    "word": word_text
                })

        print(f"[WhisperX] ✅ Found {len(word_fragments)} word-level timestamps")
        return word_fragments
        
    except Exception as e:
        print(f"[WhisperX] ⚠️  WhisperX also failed: {e}")
        print("[Alignment] ❌ All methods failed, returning empty list")
        return []
