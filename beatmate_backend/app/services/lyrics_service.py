from google import genai
from app import config

# Initialize Gemini client once
# client = genai.Client(api_key="AIzaSyCVox8noLLQQOgokVscwkaMmQ4t6F7r-DA")
client = genai.Client(api_key=config.GEMINI_API_KEY)

def generate_complete_lyrics(lyrics_snippet: str, genre: str) -> str:
    """
    Calls Gemini API to generate completed lyrics.
    """
    prompt_text = f"""
You're a meticulous lyricist. Expand the user's lyrics into a full, singable song while STRICTLY preserving the original meaning, key phrases, and tone. Keep the user's lines intact where possible; only add connective lines, structure, and tasteful poetic enhancements.

Requirements:
- Use sections: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Chorus], [Outro]
- Preserve user-provided lines verbatim when possible; do not contradict or overwrite their content
- Add coherent rhymes, rhythm, and imagery that match the user's theme
- Keep language natural and performance-ready; no explanations or metadata
- Return only the lyrics with newline (\\n) separators

Genre: {genre}
User lyrics (must be preserved as anchors):
{lyrics_snippet}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_text
    )

    # Get the generated lyrics text
    lyrics = response.text.strip()

     # Debug log
    print("=== Gemini Generated Lyrics ===")
    print(lyrics)

    return lyrics


def mashup_lyrics(lyrics_a: str, lyrics_b: str, genre: str) -> str:
    """
    Creates a coherent mashup lyric by blending two sets of lyrics.
    Preserves core phrases while creating transitions and a single structure.
    """
    prompt_text = f"""
You're an expert songwriter. Create a single coherent song by MASHING UP the two lyrics below.
- Preserve memorable lines from both inputs.
- Create smooth transitions.
- Use sections: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Chorus], [Outro]
- Keep it performance-ready, with newline (\\n) separators only.
- Genre: {genre}

Lyrics A:
{lyrics_a}

Lyrics B:
{lyrics_b}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_text
    )
    return response.text.strip()