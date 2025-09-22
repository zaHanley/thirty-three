# THIRTYTHR33

Web app for generating and exploring complex polyrhythmic patterns, specifically designed for creating musical groupings that layer guest cycles over host time signatures in the style of Meshuggah.

## Overview

THIRTYTHR33 is a mathematical music composition tool that generates rhythmic groupings by partitioning guest cycles (like 19/16) into various duration combinations. It provides real-time audio playback, visual feedback, MIDI export, and advanced filtering options for discovering unique polyrhythmic relationships.

## Features

### 🎵 Rhythm Generation

- **Polyrhythmic Patterns**: Generate complex rhythmic groupings from guest cycles over host time signatures
- **Mathematical Partitioning**: Uses recursive algorithms to create all possible duration combinations
- **Smart Filtering**: Advanced rules ensure musically interesting and practical results

### 🎛️ Customizable Parameters

- **Tempo Control**: Adjustable BPM for playback
- **Time Signatures**: Configurable host (e.g., 4/4) and guest (e.g., 19/16) cycles
- **Duration Selection**: Toggle specific note durations (1, 2, 3, 4, 5, 6, 7, 9 sixteenth notes)
- **Phrase Length**: Set the number of bars for complete musical phrases
- **Repetition Limits**: Control maximum consecutive identical values

### 🔊 Audio Engine

- **Real-time Playback**: High-precision audio synthesis using Tone.js
- **Multiple Sound Layers**:
  - Synthesized notes for rhythmic patterns
  - Metronome clicks on every beat
  - Snare hits on beat 3 of each measure
- **Visual Highlighting**: Real-time color-coded display of currently playing notes
- **Mobile-Friendly**: Optimized audio handling for mobile browsers

### 📊 Organization & Discovery

- **Intelligent Grouping**: Automatically organizes results by starting duration
- **Filter Controls**: Show/hide specific grouping categories
- **Random Selection**: Discover new patterns with one-click randomization
- **Search Capabilities**: Visual scanning of hundreds of generated possibilities

### 💾 Export Options

- **MIDI Generation**: Export any pattern as a properly formatted MIDI file
- **Accurate Timing**: Preserves exact rhythmic relationships and phrase structures
- **DAW Compatible**: Ready for import into any digital audio workstation

### 🎯 Advanced Musical Rules

- **Diversity Requirements**: Ensures patterns contain varied note durations
- **Essential Rhythms**: Requires presence of specific durations (5 or 7) for musical interest
- **Placement Logic**: Sophisticated rules for positioning short durations (1s) only adjacent to longer values
- **Repetition Control**: Prevents excessive consecutive identical durations

## How It Works

### 1. Mathematical Foundation

The application uses recursive partitioning algorithms to generate every possible way to divide a guest cycle (like 19 sixteenth notes) using your selected duration set. For a 19/16 guest cycle, this might create thousands of unique combinations.

### 2. Musical Filtering

Raw mathematical combinations are filtered through multiple musical rules:

- Must contain variety (multiple different durations)
- Must include essential rhythmic elements (5s or 7s)
- Must follow placement rules for short durations
- Must respect repetition limits

### 3. Rhythmic Context

Each grouping is placed within the context of:

- A host time signature (typically 4/4)
- A specified number of phrase bars
- Proper truncation handling when cycles don't align perfectly

### 4. Audio Synthesis

The Tone.js audio engine provides:

- Precise timing using performance.now() for sample-accurate playback
- Multiple synthesis layers for complete rhythmic context
- Loop-friendly playback that cycles seamlessly

## Usage

### Basic Workflow

1. **Configure Parameters**: Set your tempo, time signatures, and enabled durations
2. **Generate**: Click "Generate" to create all possible groupings
3. **Filter**: Use show/hide controls to focus on specific starting durations
4. **Explore**: Click any grouping to hear it with full rhythmic context
5. **Export**: Download MIDI files for use in your music production workflow

### Advanced Features

- **Random Discovery**: Use the "Random" button to explore unexpected patterns
- **Visual Analysis**: Watch real-time highlighting to understand complex rhythmic relationships
- **MIDI Integration**: Export patterns maintain accurate timing for professional music production

## Technical Details

### Built With

- **Vue 3**: Modern reactive framework with Composition API
- **TypeScript**: Type-safe development for reliability
- **Tone.js**: Professional web audio synthesis and timing
- **Tailwind CSS + DaisyUI**: Responsive, modern interface design
- **midi-writer-js**: Accurate MIDI file generation

### Browser Support

- Modern browsers with Web Audio API support
- Optimized for both desktop and mobile use
- Touch-friendly interface for tablet composition

### Performance

- Efficient algorithms handle thousands of generated patterns
- Lazy loading and virtualization for smooth interaction
- Memory-conscious audio resource management

## Mathematical Background

The core algorithm explores the mathematical concept of integer partitioning, specifically restricted partitions where only certain "part sizes" (durations) are allowed. Each generated grouping represents a unique way to partition the guest cycle length using the enabled duration set.

The musical rules transform pure mathematical partitions into musically meaningful rhythmic patterns, ensuring that the generated results are both mathematically complete and artistically useful.

## Easter Eggs

The application includes special handling for the "Rational Gaze" pattern (15131231314) - a nod to the polyrhythmic complexity found in progressive metal music. When this specific grouping appears, it receives special prioritization in the sorting algorithm.

## Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Example Use Cases

### Progressive Metal Composition

- Generate complex polyrhythmic patterns for odd time signatures
- Layer 19/16 guest cycles over 4/4 host signatures
- Export MIDI patterns for guitar, bass, and drum programming

### Rhythmic Study & Education

- Explore mathematical relationships in music
- Visualize how complex rhythms break down into component parts
- Practice playing along with generated patterns

### Experimental Music Production

- Discover unexpected rhythmic combinations
- Use random generation for creative inspiration
- Create intricate polyrhythmic foundations for electronic music

## Contributing

This project welcomes contributions, especially:

- Additional musical rule sets
- New export formats
- Enhanced audio synthesis options
- Performance optimizations
- UI/UX improvements

## License

MIT License - Feel free to use, modify, and distribute.

---

_THIRTYTHR33 - Where mathematics meets music, and complex rhythms become accessible._
