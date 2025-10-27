import os
from moviepy.editor import ImageClip, AudioFileClip, CompositeVideoClip, TextClip
from moviepy.video.fx.all import fadein, fadeout

def split_text_into_lines(text, max_chars_per_line=40):
    """
    Split text into multiple lines for better readability.
    Tries to break at natural word boundaries.
    """
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1  # +1 for space
        
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

def group_words_into_segments(word_timestamps, max_duration=4.0):
    """
    Group words into timed segments for display.
    Each segment shows for a few seconds.
    """
    segments = []
    current_segment_words = []
    
    for word_obj in word_timestamps:
        current_segment_words.append(word_obj)
        
        # Check if we should create a new segment
        if len(current_segment_words) > 0:
            segment_duration = word_obj["end"] - current_segment_words[0]["start"]
            
            if segment_duration >= max_duration:
                segment_start = current_segment_words[0]["start"]
                segment_end = current_segment_words[-1]["end"]
                segment_text = " ".join([w["word"] for w in current_segment_words])
                
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
        segment_text = " ".join([w["word"] for w in current_segment_words])
        
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
    resolution=(1920, 1080),
    fontsize=90,
):
    """
    Renders a simple, clean lyric video with multi-line text display.
    
    Features:
    - Text appears in 2-3 line segments
    - White text with black outline (like professional lyric videos)
    - Static text (no color changes or blinking)
    - Centered and properly positioned
    - Changes every few seconds based on timing
    """
    audio = AudioFileClip(audio_path)
    duration = audio.duration

    # Background - resize to cover full screen
    bg = ImageClip(background_image_path).set_duration(duration)
    bg = bg.resize(height=resolution[1])
    
    # Group words into timed segments
    print("[Video Generator] Creating text segments...")
    segments = group_words_into_segments(word_timestamps, max_duration=4.0)
    print(f"[Video Generator] Created {len(segments)} text segments.")
    
    all_text_clips = []
    
    # Create text clips for each segment
    for segment in segments:
        segment_start = segment["start"]
        segment_end = segment["end"]
        segment_duration = segment_end - segment_start
        segment_text = segment["text"]
        
        # Split text into 2-3 lines for readability
        lines = split_text_into_lines(segment_text, max_chars_per_line=40)
        multiline_text = "\n".join(lines)
        
        # Create text clip - centered, white with black stroke
        txt_clip = TextClip(
            multiline_text,
            fontsize=fontsize,
            font="Impact",  # Bold, strong font similar to reference image
            color="white",
            stroke_color="black",
            stroke_width=4,
            method="caption",  # Better for multi-line text
            size=(int(resolution[0] * 0.9), None),  # 90% width, auto height
            align="center"
        ).set_start(segment_start).set_duration(segment_duration).set_position(("center", "center"))
        
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
    
    print(f"[Video Generator] ✅ Lyric video created successfully!")
