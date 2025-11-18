import os
import re
from moviepy.editor import ImageClip, AudioFileClip, CompositeVideoClip, TextClip
from moviepy.video.fx.all import fadein, fadeout

def split_text_into_lines(text, max_chars_per_line=35, max_lines=3):
    """
    Split text into multiple lines with intelligent breaking.
    Breaks at natural phrase/sentence boundaries for better readability.
    """
    # First, try to split by sentence-like patterns (commas, periods, etc.)
    # Common patterns: ", ", " and ", " but ", " or ", " so ", " then ", etc.
    
    # Split by common phrase separators while keeping them
    patterns = [
        (r'([,;:])\s+', r'\1\n'),  # After punctuation
        (r'\s+(and|but|or|so|yet|then|now|while)\s+', r'\n\1 '),  # Before conjunctions
    ]
    
    processed_text = text
    
    # Don't auto-split if text is short enough
    if len(text) <= max_chars_per_line * max_lines:
        # Try intelligent splitting for longer phrases
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for i, word in enumerate(words):
            word_length = len(word) + 1
            
            # Check if adding this word would exceed the limit
            if current_length + word_length <= max_chars_per_line:
                current_line.append(word)
                current_length += word_length
            else:
                # Break here if we have content
                if current_line:
                    lines.append(" ".join(current_line))
                    if len(lines) >= max_lines:
                        # Add remaining words to last line if we hit max lines
                        lines[-1] += " " + " ".join(words[i:])
                        break
                current_line = [word]
                current_length = word_length
        
        if current_line:
            lines.append(" ".join(current_line))
        
        return lines
    
    # For very short text, return as single line
    if len(text) <= max_chars_per_line:
        return [text]
    
    # Otherwise, do smart word wrapping
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1
        
        if current_length + word_length <= max_chars_per_line:
            current_line.append(word)
            current_length += word_length
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            current_length = word_length
    
    if current_line:
        lines.append(" ".join(current_line))
    
    return lines

def group_words_into_segments(word_timestamps, max_duration=5.0, min_duration=2.5):
    """
    Group words into timed segments with intelligent boundary detection.
    Tries to break at natural pauses (sentence endings, phrase boundaries).
    Skips instrumental sections (gaps with no words).
    """
    if not word_timestamps:
        return []  # No words = no text to display
    
    segments = []
    current_segment_words = []
    
    # Punctuation that indicates sentence/phrase endings
    sentence_enders = ['.', '!', '?', ',', ';', ':']
    
    for i, word_obj in enumerate(word_timestamps):
        current_segment_words.append(word_obj)
        
        if len(current_segment_words) > 0:
            segment_duration = word_obj["end"] - current_segment_words[0]["start"]
            word_text = word_obj.get("word", "").strip()
            
            # Skip empty words (instrumental sections detected by WhisperX)
            if not word_text:
                continue
            
            # Check if this word ends with punctuation or is a natural break point
            is_natural_break = any(word_text.endswith(p) for p in sentence_enders)
            
            # Look ahead to see if next word is a conjunction/connector
            is_before_connector = False
            if i + 1 < len(word_timestamps):
                next_word = word_timestamps[i + 1].get("word", "").strip().lower()
                connectors = ['and', 'but', 'or', 'so', 'yet', 'then', 'while', 'though', 'because']
                is_before_connector = next_word in connectors
            
            # Check for large gap to next word (instrumental section)
            is_before_gap = False
            if i + 1 < len(word_timestamps):
                next_word_start = word_timestamps[i + 1]["start"]
                gap = next_word_start - word_obj["end"]
                if gap > 3.0:  # More than 3 seconds gap = likely instrumental
                    is_before_gap = True
            
            # Create segment if:
            # 1. Duration exceeds max OR
            # 2. Duration is reasonable AND we hit a natural break point OR
            # 3. There's a large gap ahead (instrumental section)
            should_break = False
            
            if segment_duration >= max_duration:
                should_break = True
            elif segment_duration >= min_duration and (is_natural_break or is_before_connector or is_before_gap):
                should_break = True
            
            if should_break:
                segment_start = current_segment_words[0]["start"]
                segment_end = current_segment_words[-1]["end"]
                segment_text = " ".join([w["word"] for w in current_segment_words if w.get("word", "").strip()])
                
                if segment_text:  # Only add if there's actual text
                    segments.append({
                        "start": segment_start,
                        "end": segment_end,
                        "text": segment_text
                    })
                current_segment_words = []
    
    # Add remaining words
    if current_segment_words:
        segment_start = current_segment_words[0]["start"]
        segment_end = current_segment_words[-1]["end"]
        segment_text = " ".join([w["word"] for w in current_segment_words if w.get("word", "").strip()])
        
        if segment_text:  # Only add if there's actual text
            segments.append({
                "start": segment_start,
                "end": segment_end,
                "text": segment_text
            })
    
    return segments


def render_lyric_video(
    audio_path,
    word_timestamps,
    background_image_path,
    output_path,
    resolution=(1920, 1080),  # 16:9 aspect ratio
    fontsize=110,  # Larger font for better visibility
):
    """
    Renders a professional lyric video with intelligent text breaking.
    
    Features:
    - Intelligent sentence/phrase boundary detection
    - Aesthetic brush-style font
    - Large, readable text (110px)
    - White text with bold black outline
    - Static text (no color changes)
    - Centered and properly positioned
    - Smooth fade transitions
    - 16:9 aspect ratio (1920x1080)
    """
    audio = AudioFileClip(audio_path)
    duration = audio.duration

    # Background - ensure 16:9 aspect ratio
    bg = ImageClip(background_image_path).set_duration(duration)
    # Resize to exactly match resolution while maintaining aspect ratio
    bg = bg.resize(width=resolution[0])
    if bg.h < resolution[1]:
        bg = bg.resize(height=resolution[1])
    
    # Group words into segments with intelligent breaking
    print("[Video Generator] Creating text segments with smart boundaries...")
    segments = group_words_into_segments(
        word_timestamps, 
        max_duration=5.0,  # Longer segments for complete sentences
        min_duration=2.5   # Minimum duration before checking for breaks
    )
    print(f"[Video Generator] Created {len(segments)} text segments.")
    
    # If no segments (pure instrumental or no lyrics detected), just render background
    all_text_clips = []
    
    if not segments:
        print("[Video Generator] No lyrics detected - rendering instrumental video (background only).")
    else:
        # Try bold brush/script fonts (in order of preference)
        brush_fonts = [
            "Marker-Felt-Wide",      # Bold marker/brush style (Mac)
            "Bradley-Hand-Bold",     # Bold handwritten (Mac/Windows)
            "Chalkduster",           # Bold chalk/brush style (Mac)
            "Comic-Sans-MS-Bold",    # Not script but bold and friendly
            "Arial-Black",           # Very bold fallback
            "Impact"                 # Last resort
        ]
        
        selected_font = "Impact"  # Default fallback
        for font in brush_fonts:
            try:
                test_clip = TextClip("Test", font=font, fontsize=fontsize)
                test_clip.close()
                selected_font = font
                print(f"[Video Generator] Using font: {selected_font}")
                break
            except:
                continue
        
        # Create text clips for each segment
        for segment in segments:
            segment_start = segment["start"]
            segment_end = segment["end"]
            segment_duration = segment_end - segment_start
            segment_text = segment["text"]
            
            # Split text into 2-3 lines with smart breaking
            lines = split_text_into_lines(
                segment_text, 
                max_chars_per_line=30,  # Shorter lines = bigger appearance
                max_lines=3
            )
            multiline_text = "\n".join(lines)
            
            print(f"[Video Generator] Segment {segment_start:.1f}s: {lines}")
            
            # Create text clip with bold styling
            try:
                txt_clip = TextClip(
                    multiline_text,
                    fontsize=fontsize,
                    font=selected_font,
                    color="white",
                    stroke_color="black",
                    stroke_width=6,  # Extra thick stroke for bold appearance
                    method="caption",
                    size=(int(resolution[0] * 0.85), None),  # 85% width for better margins
                    align="center"
                ).set_start(segment_start).set_duration(segment_duration).set_position(("center", "center"))
            except Exception as txt_error:
                print(f"❌ TextClip error: {txt_error}")
                print(f"   Font: {selected_font}, Text: {multiline_text[:50]}...")
                raise RuntimeError(f"Failed to create text clip. Make sure ImageMagick is installed. Error: {txt_error}")
            
            # Add smooth fade in/out
            txt_clip = fadein(txt_clip, 0.3)
            txt_clip = fadeout(txt_clip, 0.3)
            
            all_text_clips.append(txt_clip)
    
    # Composite everything
    print("[Video Generator] Compositing video...")
    final = CompositeVideoClip([bg] + all_text_clips).set_duration(duration).set_audio(audio)

    # Render with high quality
    print(f"[Video Generator] Rendering to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac",
        bitrate="8000k",
        preset="medium",
        threads=4
    )

    # Cleanup
    print("[Video Generator] Cleaning up resources...")
    final.close()
    audio.close()
    bg.close()
    for c in all_text_clips:
        c.close()
    
    print(f"[Video Generator] ✅ Professional lyric video created successfully!")
