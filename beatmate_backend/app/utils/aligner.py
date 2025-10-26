import whisperx
import torch

def align_audio_with_lyrics(audio_path, lyrics_txt_path=None):
    """
    Align lyrics with audio using WhisperX.
    Returns list of {"start": float, "end": float, "text": "..."}.
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

    # Step 2: Alignment
    print("[WhisperX] Aligning words to timestamps...")
    align_model, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
    result_aligned = whisperx.align(result["segments"], align_model, metadata, audio, device)

    fragments = []
    for seg in result_aligned["segments"]:
        text = seg.get("text", "").strip()
        if not text:
            continue
        start = float(seg["start"])
        end = float(seg["end"])
        fragments.append({"start": start, "end": end, "text": text})

    print(f"[WhisperX] Found {len(fragments)} aligned lyric segments.")
    return fragments
