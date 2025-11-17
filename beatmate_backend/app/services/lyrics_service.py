from google import genai
from app import config
import re

# Initialize Gemini client once
client = genai.Client(api_key=config.GEMINI_API_KEY)


def clean_lyrics(lyrics: str) -> str:
    """
    Remove markdown code block artifacts from Gemini output.
    """
    # Remove code block markers (```)
    lyrics = lyrics.replace('```', '')
    
    # Clean up any extra blank lines
    lyrics = re.sub(r'\n{3,}', '\n\n', lyrics)
    
    # Strip leading/trailing whitespace
    lyrics = lyrics.strip()
    
    return lyrics

def generate_complete_lyrics(lyrics_snippet: str, genre: str) -> str:
    """
    Calls Gemini API to generate completed lyrics.
    """
    prompt_text = f"""
You are an expert music lyricist creating {genre} song lyrics. These lyrics will be used by MusicGPT to generate a professional song.

**User Input:**
{lyrics_snippet}

**Instructions:**

1. **Analyze the input type:**
   - If it's a DESCRIPTION/PROMPT → Create complete original lyrics
   - If it's PARTIAL LYRICS → PRESERVE exactly as written, then expand naturally
   - If it's COMPLETE LYRICS → Keep all content, just add structure tags if missing
   - Generate lyrics in the language specified by the user or match the language of the provided lyrics

2. **Essential Structure:**
   - Use sections: [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus], [Outro]
   - CRITICAL: Keep total length under 2500 characters (MusicGPT limit is 3000)
   - Make the chorus catchy and repeatable

3. **{genre} Genre Optimization:**
   - Follow typical {genre} themes, rhythm, and style
   - Use appropriate language and imagery for this genre
   - Create singable, memorable hooks

4. **Performance Quality:**
   - Add vocal fills where natural (if necessary): (oh), (yeah), (mmm)
   - Preserve user-provided lines verbatim when possible; do not contradict or overwrite their content
   - Add coherent rhymes, rhythm, and imagery that match the user's theme
   - Build emotional arc throughout the song
   - Ensure natural speech patterns for singing

**Output Format:**
- Section markers: [Intro], [Verse 1], etc.
- One line per lyric line
- ONLY the lyrics - no explanations
- DO NOT use markdown formatting (no ```, no **, no #, no *)
- Output raw lyrics only, no code blocks or formatting

Create lyrics that will sound amazing when performed!
"""

    try:
        print("🎵 Calling Gemini API for lyrics generation...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text
        )

        # Get the generated lyrics text and clean any markdown artifacts
        lyrics = response.text.strip()
        lyrics = clean_lyrics(lyrics)

        # Debug log
        print("=== Gemini Generated Lyrics ===")
        print(lyrics)
        print("✅ Lyrics generation successful")

        return lyrics
    
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        
        print("=" * 60)
        print("❌ GEMINI API ERROR - Lyrics Generation")
        print("=" * 60)
        print(f"Error Type: {error_type}")
        print(f"Error Message: {error_msg}")
        
        # Check for specific error types
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg.upper() or "quota" in error_msg.lower():
            print("⚠️  Rate Limit Exceeded:")
            print("   - Gemini API quota exhausted")
            print("   - Wait a few minutes or upgrade your API plan")
            print("   - Consider implementing request throttling")
            raise RuntimeError("Gemini API rate limit exceeded (429). Please wait a few minutes and try again.")
        
        elif "503" in error_msg or "UNAVAILABLE" in error_msg.upper() or "overloaded" in error_msg.lower():
            print("⚠️  Service Unavailable (503):")
            print("   - Gemini model is temporarily overloaded")
            print("   - This is a Google server-side issue")
            print("   - Wait 10-30 seconds and try again")
            print("   - If persists, try switching to a different model")
            print("=" * 60)
            raise RuntimeError("Gemini API is temporarily overloaded (503). Please wait a moment and try again.")
        
        elif "500" in error_msg or "INTERNAL" in error_msg.upper():
            print("⚠️  Internal Server Error (500):")
            print("   - Gemini API internal error")
            print("   - This is a temporary Google server issue")
            print("   - Wait a few moments and try again")
            print("=" * 60)
            raise RuntimeError("Gemini API internal error (500). Please try again in a moment.")
        
        elif "403" in error_msg or "permission" in error_msg.lower():
            print("⚠️  Permission Denied:")
            print("   - Check your Gemini API key")
            print("   - Verify API is enabled in Google Cloud Console")
            raise RuntimeError("Gemini API permission denied. Check your API key.")
        
        elif "401" in error_msg or "unauthorized" in error_msg.lower():
            print("⚠️  Unauthorized:")
            print("   - Invalid or expired API key")
            raise RuntimeError("Gemini API key is invalid or expired.")
        
        else:
            print(f"⚠️  Unexpected Error: {error_msg}")
            print("=" * 60)
            raise RuntimeError(f"Gemini API error: {error_msg}")


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
   - CRITICAL: Keep total length under 2500 characters (MusicGPT limit is 3000)
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
   - DO NOT use markdown formatting (no ```, no **, no #, no *)
   - Output raw lyrics only, no code blocks or formatting

Create a mashup that feels professional, creative, and emotionally resonant!
"""
    
    try:
        print(f"🎵 Calling Gemini API for mashup generation: {title}")
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt_text
        )
        
        # Get mashup text and clean any markdown artifacts
        mashup = response.text.strip()
        mashup = clean_lyrics(mashup)
        
        # Debug log
        print("=== Gemini Generated Mashup ===")
        print(f"Title: {title}")
        print(f"Genre: {genre}")
        print(mashup)
        print("✅ Mashup generation successful")
        print("=" * 50)
        
        return mashup
    
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        
        print("=" * 60)
        print("❌ GEMINI API ERROR - Mashup Generation")
        print("=" * 60)
        print(f"Error Type: {error_type}")
        print(f"Error Message: {error_msg}")
        
        # Check for specific error types
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg.upper() or "quota" in error_msg.lower():
            print("⚠️  Rate Limit Exceeded:")
            print("   - Gemini API quota exhausted")
            print("   - Wait a few minutes or upgrade your API plan")
            print("   - Consider implementing request throttling")
            raise RuntimeError("Gemini API rate limit exceeded (429). Please wait a few minutes and try again.")
        
        elif "503" in error_msg or "UNAVAILABLE" in error_msg.upper() or "overloaded" in error_msg.lower():
            print("⚠️  Service Unavailable (503):")
            print("   - Gemini model is temporarily overloaded")
            print("   - This is a Google server-side issue")
            print("   - Wait 10-30 seconds and try again")
            print("   - If persists, try switching to a different model")
            print("=" * 60)
            raise RuntimeError("Gemini API is temporarily overloaded (503). Please wait a moment and try again.")
        
        elif "500" in error_msg or "INTERNAL" in error_msg.upper():
            print("⚠️  Internal Server Error (500):")
            print("   - Gemini API internal error")
            print("   - This is a temporary Google server issue")
            print("   - Wait a few moments and try again")
            print("=" * 60)
            raise RuntimeError("Gemini API internal error (500). Please try again in a moment.")
        
        elif "403" in error_msg or "permission" in error_msg.lower():
            print("⚠️  Permission Denied:")
            print("   - Check your Gemini API key")
            print("   - Verify API is enabled in Google Cloud Console")
            raise RuntimeError("Gemini API permission denied. Check your API key.")
        
        elif "401" in error_msg or "unauthorized" in error_msg.lower():
            print("⚠️  Unauthorized:")
            print("   - Invalid or expired API key")
            raise RuntimeError("Gemini API key is invalid or expired.")
        
        else:
            print(f"⚠️  Unexpected Error: {error_msg}")
            print("=" * 60)
            raise RuntimeError(f"Gemini API error: {error_msg}")