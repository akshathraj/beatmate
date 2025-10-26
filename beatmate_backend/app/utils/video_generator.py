import os
from moviepy.editor import ImageClip, AudioFileClip, CompositeVideoClip, TextClip
from moviepy.video.fx.all import fadein, fadeout

def render_lyric_video(
    audio_path,
    timestamps,
    background_image_path,
    output_path,
    resolution=(1280, 720),
    fontsize=56,
    font="DejaVu-Sans-Bold",
    text_color="white",
    stroke_color="black",
    stroke_width=2,
):
    """Renders a lyric video with line-by-line timed text."""
    audio = AudioFileClip(audio_path)
    duration = audio.duration

    bg = ImageClip(background_image_path).set_duration(duration)
    bg = bg.resize(width=resolution[0])

    text_clips = []
    for frag in timestamps:
        start, end = frag["start"], frag["end"]
        dur = max(0.5, end - start)
        txt = frag["text"]

        txt_clip = (
            TextClip(
                txt,
                fontsize=fontsize,
                font="Helvetica-Bold",
                color=text_color,
                stroke_color=stroke_color,
                stroke_width=stroke_width,
                method="label",
                size=(int(resolution[0] * 0.8), None),
            )
            .set_start(start)
            .set_duration(dur)
            .set_position(("center", int(resolution[1] * 0.65)))
        )
        txt_clip = fadein(txt_clip, 0.2)
        txt_clip = fadeout(txt_clip, 0.2)
        text_clips.append(txt_clip)

    final = CompositeVideoClip([bg, *text_clips]).set_duration(duration).set_audio(audio)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")

    final.close()
    audio.close()
    bg.close()
    for c in text_clips:
        c.close()
