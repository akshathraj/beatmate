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


def mashup_lyrics(lyrics_a: str, lyrics_b: str, genre: str = "Pop", title: str = "Remix") -> str:
    """
    Creates an intelligent, creative mashup by blending two songs using Gemini AI.
    
    This function:
    - Analyzes themes, emotions, and key phrases from both songs
    - Blends them creatively with smooth transitions
    - Creates new connecting lines if needed for better flow
    - Maintains consistent narrative and emotional arc
    - Adapts to the specified genre
    """
    prompt_text = f"""You are an expert music lyricist creating a creative mashup remix titled "{title}".

**Song A Lyrics:**
{lyrics_a}

**Song B Lyrics:**
{lyrics_b}

**Task:** Create an intelligent mashup in {genre} style that:

1. **Analyze Both Songs:**
   - Identify the main themes, emotions, and memorable phrases from each song
   - Understand the narrative arc and emotional journey of each
   - Find complementary or contrasting elements that can work together

2. **Blend Creatively:**
   - Don't just concatenate sections - weave them together naturally
   - Preserve the most memorable/catchy lines from both songs
   - Create smooth transitions between different sections
   - You may create new connecting lines to bridge sections seamlessly
   - Mix languages naturally if songs are in different languages

3. **Structure (40-50 lines total):**
   - [Intro] - Set the tone, can blend both songs' themes
   - [Verse 1] - Primarily from Song A with elements of Song B
   - [Chorus] - Blend the catchiest hooks from both songs
   - [Verse 2] - Primarily from Song B with elements of Song A
   - [Chorus] - Repeat or variation
   - [Bridge] - Create contrast, can introduce new connecting ideas
   - [Outro] - Bring it together, memorable ending

4. **Quality Guidelines:**
   - Maintain consistent rhyme scheme and rhythm
   - Ensure natural flow - no jarring transitions
   - Keep the energy appropriate for {genre} music
   - The result should feel like a NEW cohesive song, not two songs glued together
   - Emotional arc should make sense
   - Use the best, most memorable parts from each song

5. **Format:**
   - Use section markers: [Intro], [Verse 1], [Chorus], etc.
   - One line per lyric line
   - No explanations, just the lyrics
   - Performance-ready output

Create a mashup that feels professional, creative, and emotionally resonant!
"""
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=prompt_text
    )
    
    mashup = response.text.strip()
    
    # Debug log
    print("=== Gemini Generated Mashup ===")
    print(f"Title: {title}")
    print(f"Genre: {genre}")
    print(mashup)
    print("=" * 50)
    
    return mashup