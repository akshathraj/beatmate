import whisperx
import torch

def align_audio_with_lyrics(audio_path, lyrics_txt_path=None):
    """
    Align lyrics with audio using WhisperX - WORD-LEVEL timestamps.
    Returns list of {"start": float, "end": float, "word": "..."}.
    lyrics_txt_path is optional (for future guided alignment).
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[WhisperX] Using device: {device}")

    # Load model
    model = whisperx.load_model("small", device, compute_type="float32")
    audio = whisperx.load_audio(audio_path)

    # Step 1: Transcription
    print("[WhisperX] Transcribing audio...")
    result = model.transcribe(audio)

    # Step 2: Word-level Alignment
    print("[WhisperX] Aligning words to timestamps...")
    align_model, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
    result_aligned = whisperx.align(result["segments"], align_model, metadata, audio, device)

    # Extract WORD-level timestamps
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

    print(f"[WhisperX] Found {len(word_fragments)} word-level timestamps.")
    return word_fragments
