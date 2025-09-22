<template>
  <div class="min-h-screen overflow-y-scroll">
    <!-- Audio Unlock Modal for Mobile -->
    <div
      v-if="showAudioUnlock"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-base-100 p-6 rounded-lg shadow-xl max-w-sm mx-4 text-center">
        <div class="text-4xl mb-4">🔊</div>
        <h3 class="font-bold text-lg mb-2">Enable Audio</h3>
        <p class="text-sm text-base-content opacity-75 mb-4">
          <span v-if="isIOS()">
            iOS requires user interaction to enable audio. Please tap the button below and ensure
            your device is not in silent mode.
          </span>
          <span v-else>
            Mobile browsers require user interaction to enable audio. Tap the button below to unlock
            audio playback.
          </span>
        </p>
        <div class="space-y-3">
          <button @click="unlockAudio" class="btn btn-primary btn-wide">
            <span v-if="isIOS()">🍎 Enable iOS Audio</span>
            <span v-else>🎵 Enable Audio</span>
          </button>

          <!-- Force unlock button for stubborn iOS devices -->
          <button @click="forceUnlockAudio" class="btn btn-secondary btn-wide">
            <span v-if="isIOS()">🔧 Force iOS Unlock</span>
            <span v-else>🔧 Force Audio Unlock</span>
          </button>

          <button @click="debugAudioState" class="btn btn-outline btn-sm">🔍 Debug Info</button>
        </div>

        <p class="text-xs text-base-content opacity-50 mt-3">
          This only needs to be done once per session
        </p>
        <p v-if="isIOS()" class="text-xs text-orange-600 mt-2">
          💡 If audio still doesn't work, try Force Unlock or check that your device is not in
          silent mode
        </p>
      </div>
    </div>

    <!-- Sticky Controls Header -->
    <div class="sticky top-0 z-10 bg-base-100 border-b border-base-300 shadow-md">
      <div class="p-3 sm:p-4 max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-xl sm:text-2xl font-bold">THIRTYTHR33</h1>
          <button @click="isControlsExpanded = !isControlsExpanded" class="btn btn-xs btn-circle">
            <span v-if="isControlsExpanded">−</span>
            <span v-else>+</span>
          </button>
        </div>

        <div v-show="isControlsExpanded" class="space-y-3">
          <!-- Mobile: Stack vertically, Desktop: Side by side -->
          <div class="flex flex-col lg:flex-row gap-3 w-full">
            <!-- Input fields section -->
            <div class="w-full lg:flex-[2] p-3 bg-base-200 rounded">
              <!-- Mobile: Single column, Desktop: Two columns -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <div class="space-y-2">
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Tempo</span>
                    <input
                      v-model.number="tempo"
                      type="number"
                      placeholder="120"
                      class="text-sm w-full"
                    />
                  </label>
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Host</span>
                    <input
                      v-model="hostTimeSig"
                      type="text"
                      placeholder="4/4"
                      class="text-sm w-full"
                    />
                  </label>
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Guest</span>
                    <input
                      v-model="guestCycle"
                      type="text"
                      placeholder="25/16"
                      class="text-sm w-full"
                    />
                  </label>
                </div>
                <div class="space-y-2">
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Bars</span>
                    <input
                      v-model.number="phraseBars"
                      type="number"
                      placeholder="8"
                      class="text-sm w-full"
                    />
                  </label>
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Pitch</span>
                    <input
                      v-model.number="pitch"
                      type="number"
                      placeholder="41"
                      class="text-sm w-full"
                    />
                  </label>
                  <label class="input input-sm rounded w-full">
                    <span class="text-secondary text-xs">Max Repeat</span>
                    <input
                      v-model.number="maxRepeat"
                      type="number"
                      placeholder="3"
                      class="text-sm w-full"
                    />
                  </label>
                </div>
              </div>
            </div>

            <!-- Partition selection controls -->
            <div class="w-full lg:flex-1 p-3 bg-base-200 rounded">
              <h3 class="text-xs font-medium mb-2">Enabled Durations:</h3>
              <div class="space-y-2">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="partitionValue in [1, 2, 3, 4]"
                    :key="partitionValue"
                    @click="togglePartition(partitionValue)"
                    class="btn btn-xs rounded min-h-[2rem] text-xs"
                    :class="{
                      'btn-primary': enabledPartitions.has(partitionValue),
                      'btn-outline': !enabledPartitions.has(partitionValue),
                    }"
                  >
                    {{ partitionValue }}
                  </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="partitionValue in [5, 6, 7, 9]"
                    :key="partitionValue"
                    @click="togglePartition(partitionValue)"
                    class="btn btn-xs rounded min-h-[2rem] text-xs"
                    :class="{
                      'btn-primary': enabledPartitions.has(partitionValue),
                      'btn-outline': !enabledPartitions.has(partitionValue),
                    }"
                  >
                    {{ partitionValue }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile-friendly controls section -->
          <div class="space-y-3">
            <!-- Mobile: Stack all controls vertically -->
            <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <!-- Audio status indicator (for debugging) -->
              <div
                v-if="isMobileDevice() || isIOS()"
                class="text-xs px-2 py-1 rounded whitespace-nowrap"
                :class="
                  audioUnlocked ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                "
              >
                <span v-if="isIOS()">🍎 </span
                >{{ audioUnlocked ? '🔊 Audio Ready' : '🔇 Audio Locked' }}
              </div>

              <!-- Manual audio unlock button for testing -->
              <button
                v-if="(isMobileDevice() || isIOS()) && !audioUnlocked"
                @click="showAudioUnlock = true"
                class="btn btn-xs btn-warning whitespace-nowrap"
              >
                <span v-if="isIOS()">🍎 Unlock iOS Audio</span>
                <span v-else>🔓 Unlock Audio</span>
              </button>

              <!-- Force unlock button for stubborn devices -->
              <button
                v-if="(isMobileDevice() || isIOS()) && !audioUnlocked"
                @click="forceUnlockAudio"
                class="btn btn-xs bg-orange-600 text-white whitespace-nowrap"
              >
                🔧 Force Unlock
              </button>

              <!-- Debug button -->
              <button
                v-if="isIOS() || isMobileDevice()"
                @click="debugAudioState"
                class="btn btn-xs btn-outline whitespace-nowrap"
              >
                🔍 Debug
              </button>

              <!-- Audio mode toggle -->
              <div class="form-control">
                <label class="label cursor-pointer gap-2">
                  <span class="label-text text-xs ml-3" :class="{ 'text-primary': useSamples }">
                    Samples
                  </span>
                  <input
                    type="checkbox"
                    v-model="useSamples"
                    class="toggle toggle-xs toggle-primary"
                  />
                </label>
              </div>
            </div>

            <!-- Main action buttons - mobile responsive with 2x2 grid -->
            <div class="p-3 bg-base-200 rounded">
              <!-- Mobile: 2x2 grid, Desktop: horizontal flow -->
              <div class="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full">
                <button
                  @click="generateGroupings"
                  :disabled="isGenerating"
                  class="btn btn-sm btn-primary text-primary-content rounded min-h-[2rem] sm:flex-none"
                >
                  <span v-if="isGenerating" class="animate-pulse text-center block"
                    >Generating ...</span
                  >
                  <span v-else>Generate</span>
                </button>

                <button
                  v-if="groupings.length > 0"
                  @click="selectRandomGrouping"
                  class="btn btn-sm btn-secondary rounded min-h-[2rem] sm:flex-none"
                >
                  Random
                </button>

                <!-- Action buttons that appear when grouping is selected -->
                <template v-if="selectedGrouping">
                  <button
                    v-if="midiUrl"
                    @click="downloadMIDI"
                    class="btn btn-sm bg-purple-600 text-white rounded min-h-[2rem] sm:flex-none whitespace-nowrap text-xs sm:text-sm"
                  >
                    Download MIDI
                  </button>
                  <button
                    v-if="midiEvents.length && !isPlaying"
                    @click="playPreview()"
                    class="btn btn-sm bg-green-600 text-white rounded min-h-[2rem] sm:flex-none"
                  >
                    Play
                  </button>
                  <button
                    v-if="isPlaying"
                    @click="stopPreview"
                    class="btn btn-sm bg-red-600 text-white rounded min-h-[2rem] sm:flex-none"
                  >
                    Stop
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Selected grouping info - full width -->
          <div v-if="selectedGrouping" class="p-2 bg-base-200 rounded">
            <h3 class="text-sm font-semibold mb-2">
              {{ selectedGrouping.join(' ') }}
            </h3>
            <div class="text-xs text-base-content/70">
              <p>Full cycles: {{ fullCycles }}</p>
              <p>Truncation: {{ truncation }}/16</p>
            </div>
          </div>

          <!-- Group visibility controls -->
          <div v-if="groupings.length" class="p-3 bg-base-200 rounded">
            <h3 class="text-xs font-medium mb-2">Show/Hide Groups:</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="firstValue in [1, 2, 3, 4, 5, 6, 7, 9]"
                :key="firstValue"
                @click="toggleGroupVisibility(firstValue)"
                class="btn btn-xs rounded min-h-[2rem] text-xs"
                :class="{
                  'btn-primary': visibleGroups.has(firstValue),
                  'btn-outline': !visibleGroups.has(firstValue),
                }"
              >
                {{ firstValue }} ({{ groupCounts[firstValue] }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-3 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div v-if="groupings.length">
        <h2 class="font-semibold mb-4 text-center sm:text-left">Select a grouping:</h2>

        <div class="space-y-2">
          <details
            v-for="firstValue in [1, 2, 3, 4, 5, 6, 7, 9].filter((v) => groupCounts[v] > 0)"
            :key="firstValue"
            class="collapse bg-base-200 border-base-300 border"
            :class="{ hidden: !visibleGroups.has(firstValue) }"
          >
            <summary class="collapse-title font-semibold">
              Starting with {{ firstValue }} ({{ groupCounts[firstValue] }} groupings)
            </summary>
            <div class="collapse-content">
              <div
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3 max-h-48 overflow-y-auto"
              >
                <button
                  v-for="(g, i) in groupedGroupings[firstValue] || []"
                  :key="`${firstValue}-${i}`"
                  @click="selectGrouping(g)"
                  class="btn btn-neutral btn-sm px-2 py-1 rounded border text-xs min-h-[2.5rem] h-auto whitespace-nowrap"
                  :class="{
                    'text-primary border-primary': selectedGrouping === g && !isPlaying,
                    'text-error border-error': selectedGrouping === g && isPlaying,
                  }"
                  v-html="getButtonContent(g)"
                ></button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// @ts-ignore
import * as MidiWriter from 'midi-writer-js'
import * as Tone from 'tone'

const tempo = ref(130)
const hostTimeSig = ref('4/4')
const guestCycle = ref('25/16')
const phraseBars = ref(8)
const pitch = ref(42)
const maxRepeat = ref(1)

const isGenerating = ref(false)
const enabledPartitions = ref(new Set([1, 2, 5, 7, 9]))
const groupings = ref<number[][]>([])
const groupedGroupings = ref<Record<number, number[][]>>({})
const visibleGroups = ref(new Set([1, 2, 3, 4, 5, 6, 7, 9]))
const filteredGroupings = ref<number[][]>([])
const selectedGrouping = ref<number[] | null>(null)
const truncation = ref(0)
const fullCycles = ref(0)
const midiUrl = ref<string | null>(null)
const midiEvents = ref<{ pitch: number; duration: number }[]>([])
const isPlaying = ref(false)
const isControlsExpanded = ref(true)
const currentPlayingIndex = ref(-1)
const useSamples = ref(true) // Toggle between samples and MIDI tones
const showAudioUnlock = ref(false) // Show audio unlock modal for mobile
const audioUnlocked = ref(false) // Track if audio has been unlocked
// Sample players for your MP3 files - using multiple instances to avoid choppiness
let topSamplePlayers: Tone.Player[] = []
let chugSamplePlayers: Tone.Player[] = []
let stackSamplePlayer: Tone.Player | null = null
let snareSamplePlayer: Tone.Player | null = null

// Current player index for round-robin
let topPlayerIndex = 0
let chugPlayerIndex = 0

// MIDI synths for tone generation
let synth: Tone.PolySynth | null = null
let clickSynth: Tone.MetalSynth | null = null
let snareSynth: Tone.NoiseSynth | null = null

let clickLoop: Tone.Loop | null = null

// Timeout IDs for proper cleanup
let activeTimeouts: number[] = []
let clickTimeoutId: number | null = null
let snareTimeoutId: number | null = null

// Sample file paths - make sure these MP3 files are in your public/samples folder
const SAMPLE_PATHS = {
  top: '/samples/top.mp3', // First note of each cycle
  chug: '/samples/chug.mp3', // Rest of the notes
  stack: '/samples/stack.mp3', // Quarter note metronome
  snare: '/samples/snare.mp3', // Snare on beat 3
}

const groupCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const firstValue of [1, 2, 3, 4, 5, 6, 7, 9]) {
    counts[firstValue] = groupedGroupings.value[firstValue]?.length || 0
  }
  return counts
})

const getButtonContent = (g: number[]) => {
  if (!isPlaying.value || selectedGrouping.value !== g) {
    return g.join(' ')
  }

  return g
    .map((num, index) => {
      const colorClass = index === currentPlayingIndex.value ? 'text-warning' : 'text-success'
      return `<span class="${colorClass}">${num}</span>`
    })
    .join('')
}

function sortGroupings() {
  groupings.value = groupings.value.sort((a, b) => {
    // Sort by first value: 2, 3, 5, 7, 9
    return a[0] - b[0]
  })

  // Group by first value
  groupedGroupings.value = groupings.value.reduce(
    (acc, grouping) => {
      const firstValue = grouping[0]
      if (!acc[firstValue]) {
        acc[firstValue] = []
      }
      acc[firstValue].push(grouping)
      return acc
    },
    {} as Record<number, number[][]>,
  )

  updateFilteredGroupings()
}

function updateFilteredGroupings() {
  filteredGroupings.value = groupings.value.filter((grouping) =>
    visibleGroups.value.has(grouping[0]),
  )
}

function toggleGroupVisibility(firstValue: number) {
  if (visibleGroups.value.has(firstValue)) {
    visibleGroups.value.delete(firstValue)
  } else {
    visibleGroups.value.add(firstValue)
  }
  updateFilteredGroupings()
}

function togglePartition(partitionValue: number) {
  if (enabledPartitions.value.has(partitionValue)) {
    enabledPartitions.value.delete(partitionValue)
  } else {
    enabledPartitions.value.add(partitionValue)
  }
}

function selectRandomGrouping() {
  if (groupings.value.length === 0) return

  // Stop any current playback first
  if (isPlaying.value) {
    stopPreview()
  }

  const randomIndex = Math.floor(Math.random() * groupings.value.length)
  const randomGrouping = groupings.value[randomIndex]
  selectGrouping(randomGrouping)
}
function generateGroupings() {
  isGenerating.value = true

  // Use setTimeout to allow the UI to update before heavy computation
  setTimeout(() => {
    const [num, denom] = guestCycle.value.split('/').map(Number)
    if (denom !== 16) {
      alert('Only 16th-note based guests supported for now')
      isGenerating.value = false
      return
    }
    const rawGroupings: number[][] = []
    const allowedPartitions = Array.from(enabledPartitions.value).sort((a, b) => a - b)
    generatePartitions(num, allowedPartitions, [], rawGroupings)

    groupings.value = rawGroupings.filter((g) => {
      const unique = new Set(g)
      if (unique.size <= 1) return false
      if (!(unique.has(5) || unique.has(7))) return false
      if (hasTooManyConsecutive(g, 2, maxRepeat.value)) return false

      // Check that 1s only appear directly before or after numbers >= 3
      for (let i = 0; i < g.length; i++) {
        if (g[i] === 1) {
          const prevValid = i > 0 && g[i - 1] >= 3
          const nextValid = i < g.length - 1 && g[i + 1] >= 3
          if (!prevValid && !nextValid) return false
        }
      }

      // Check that there are never two 1s directly adjacent to each other
      for (let i = 0; i < g.length - 1; i++) {
        if (g[i] === 1 && g[i + 1] === 1) {
          return false
        }
      }

      return true
    })

    sortGroupings()
    isGenerating.value = false
  }, 10)
}

function hasTooManyConsecutive(arr: number[], value: number, maxRun: number) {
  let run = 0
  for (const v of arr) {
    if (v === value) {
      run++
      if (run > maxRun) return true
    } else run = 0
  }
  return false
}

function generatePartitions(n: number, allowed: number[], current: number[], results: number[][]) {
  if (n === 0) {
    results.push([...current])
    return
  }
  for (let a of allowed) {
    if (a <= n) generatePartitions(n - a, allowed, [...current, a], results)
  }
}

function computeTruncation() {
  const [guestNum] = guestCycle.value.split('/').map(Number)
  const [hostNum, hostDen] = hostTimeSig.value.split('/').map(Number)

  const phrase16ths = phraseBars.value * hostNum * (16 / hostDen)
  let used = 0
  let cycles = 0
  while (used + guestNum <= phrase16ths) {
    used += guestNum
    cycles++
  }
  fullCycles.value = cycles
  truncation.value = phrase16ths - used
}

async function selectGrouping(g: number[]) {
  // If we're playing and clicking the same grouping, stop
  if (
    isPlaying.value &&
    selectedGrouping.value &&
    selectedGrouping.value.length === g.length &&
    selectedGrouping.value.every((val, i) => val === g[i])
  ) {
    stopPreview()
    return
  }

  selectedGrouping.value = g
  generateMIDI()
  await playPreview()
}

function generateMIDI() {
  if (!selectedGrouping.value) return

  computeTruncation()

  const [guestNum] = guestCycle.value.split('/').map(Number)
  const [hostNum, hostDen] = hostTimeSig.value.split('/').map(Number)
  const phrase16ths = phraseBars.value * hostNum * (16 / hostDen)

  const ppq = 128
  const tickPer16th = ppq / 4

  const track = new MidiWriter.Track()
  track.setTempo(tempo.value)
  track.setTimeSignature(hostNum, hostDen)

  const cycles: number[][] = []
  let used = 0
  while (used + guestNum <= phrase16ths) {
    cycles.push(selectedGrouping.value!)
    used += guestNum
  }
  if (truncation.value > 0) {
    let rem = truncation.value
    let truncGroup: number[] = []
    for (let g of selectedGrouping.value!) {
      if (rem - g >= 0) {
        truncGroup.push(g)
        rem -= g
      } else break
    }
    if (truncGroup.length) cycles.push(truncGroup)
  }

  let currentTick = 0
  const events: { pitch: number; duration: number }[] = []
  for (let cycle of cycles) {
    for (let i = 0; i < cycle.length; i++) {
      const dur16ths = cycle[i]
      const pitchVal = i === 0 ? pitch.value + 1 : pitch.value
      const note = new MidiWriter.NoteEvent({
        pitch: [pitchVal],
        duration: `T${dur16ths * tickPer16th}`,
        startTick: currentTick,
        velocity: 100,
      })
      track.addEvent(note)
      events.push({ pitch: pitchVal, duration: dur16ths })
      currentTick += dur16ths * tickPer16th
    }
  }

  const write = new MidiWriter.Writer(track)
  const blob = new Blob([write.buildFile()], { type: 'audio/midi' })
  midiUrl.value = URL.createObjectURL(blob)
  midiEvents.value = events
}

function downloadMIDI() {
  if (!midiUrl.value) return
  const a = document.createElement('a')
  a.href = midiUrl.value
  a.download = `${selectedGrouping.value}.mid`
  a.click()
}

async function playPreview() {
  if (!midiEvents.value.length || !selectedGrouping.value) return

  // Enhanced iOS/mobile audio check
  const needsUnlock =
    (isMobileDevice() || isIOS()) && !audioUnlocked.value && Tone.context.state !== 'running'

  if (needsUnlock) {
    console.log('🔒 Audio not unlocked on iOS/mobile, showing unlock modal')
    console.log('Device details:', {
      isIOS: isIOS(),
      isSafari: isSafari(),
      isMobile: isMobileDevice(),
      contextState: Tone.context.state,
      userAgent: navigator.userAgent,
    })
    showAudioUnlock.value = true
    return
  }

  try {
    // More aggressive audio context starting for iOS
    if (isIOS() || isSafari()) {
      console.log('🍎 Starting audio on iOS/Safari with enhanced method...')

      // Force audio context resume for iOS
      if (Tone.context.state === 'suspended') {
        await Tone.context.resume()
        console.log('iOS audio context resumed, state:', Tone.context.state)
      }

      await Tone.start()
      console.log('iOS Tone.js started, context state:', Tone.context.state)

      // Additional iOS unlock with native audio
      const audioContext = Tone.context.rawContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
        console.log('Native audio context resumed for iOS')
      }
    } else {
      await Tone.start()
    }

    console.log('✅ Audio started successfully, context state:', Tone.context.state)

    // If we're on mobile/iOS and this is the first successful start, mark as unlocked
    if ((isMobileDevice() || isIOS()) && !audioUnlocked.value && Tone.context.state === 'running') {
      audioUnlocked.value = true
      console.log('🔓 Audio automatically unlocked during playback')
    }

    stopPreview()

    isPlaying.value = true
    currentPlayingIndex.value = 0

    if (useSamples.value) {
      console.log('Using samples mode')
      // Create multiple sample players for smoother playback (round-robin)
      const numPlayers = 6 // Increase to 6 instances for production stability

      topSamplePlayers = []
      chugSamplePlayers = []

      // Create players with explicit loading and error handling
      const createPlayersPromises = []

      for (let i = 0; i < numPlayers; i++) {
        const topPlayer = new Tone.Player({
          url: SAMPLE_PATHS.top,
          onload: () => console.log(`Top player ${i} loaded`),
          onerror: (error) => console.error(`Top player ${i} error:`, error),
        }).toDestination()

        const chugPlayer = new Tone.Player({
          url: SAMPLE_PATHS.chug,
          onload: () => console.log(`Chug player ${i} loaded`),
          onerror: (error) => console.error(`Chug player ${i} error:`, error),
        }).toDestination()

        topSamplePlayers.push(topPlayer)
        chugSamplePlayers.push(chugPlayer)

        // Add individual loading promises
        createPlayersPromises.push(
          new Promise((resolve) => {
            if (topPlayer.loaded) {
              resolve(`top-${i}`)
            } else {
              topPlayer.load(SAMPLE_PATHS.top).then(() => resolve(`top-${i}`))
            }
          }),
        )
        createPlayersPromises.push(
          new Promise((resolve) => {
            if (chugPlayer.loaded) {
              resolve(`chug-${i}`)
            } else {
              chugPlayer.load(SAMPLE_PATHS.chug).then(() => resolve(`chug-${i}`))
            }
          }),
        )
      }

      stackSamplePlayer = new Tone.Player({
        url: SAMPLE_PATHS.stack,
        onload: () => console.log('Stack player loaded'),
        onerror: (error) => console.error('Stack player error:', error),
      }).toDestination()

      snareSamplePlayer = new Tone.Player({
        url: SAMPLE_PATHS.snare,
        onload: () => console.log('Snare player loaded'),
        onerror: (error) => console.error('Snare player error:', error),
      }).toDestination()

      // Wait for ALL samples to load with timeout
      console.log('Waiting for all samples to load...')
      try {
        await Promise.race([
          Promise.all([
            ...createPlayersPromises,
            stackSamplePlayer.load(SAMPLE_PATHS.stack),
            snareSamplePlayer.load(SAMPLE_PATHS.snare),
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sample loading timeout')), 10000),
          ),
        ])
        console.log('All samples loaded successfully')

        // Add a small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Sample loading failed:', error)
        console.log('Falling back to MIDI synths for mobile compatibility')
        useSamples.value = false
        return playPreview() // Retry with MIDI
      }
    } else {
      console.log('Using MIDI synths mode')
      // Create MIDI synths
      synth = new Tone.PolySynth().toDestination()
      clickSynth = new Tone.MetalSynth().toDestination()
      snareSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      }).toDestination()
      console.log('MIDI synths created')
    }

    // Start both the metronome and main playback at exactly the same time
    const startTime = performance.now()
    const beatDuration = (60 / tempo.value) * 1000 // Convert to milliseconds

    // Metronome that stays in sync
    const scheduleNextClick = (nextClickTime: number) => {
      if (!isPlaying.value) return

      const now = performance.now()
      const delay = Math.max(0, nextClickTime - now)

      clickTimeoutId = window.setTimeout(() => {
        if (!isPlaying.value) return

        if (useSamples.value) {
          if (stackSamplePlayer && stackSamplePlayer.loaded) {
            stackSamplePlayer.stop()
            stackSamplePlayer.start()
          }
        } else {
          if (clickSynth) {
            clickSynth.triggerAttackRelease('C-2', '32n', '+0', 0.1)
          }
        }
        scheduleNextClick(nextClickTime + beatDuration)
      }, delay)
    }

    // Snare on beat 3 of each measure (assuming 4/4 time)
    const scheduleNextSnare = (nextSnareTime: number) => {
      if (!isPlaying.value) return

      const now = performance.now()
      const delay = Math.max(0, nextSnareTime - now)

      snareTimeoutId = window.setTimeout(() => {
        if (!isPlaying.value) return

        if (useSamples.value) {
          if (snareSamplePlayer && snareSamplePlayer.loaded) {
            snareSamplePlayer.stop()
            snareSamplePlayer.start()
          }
        } else {
          if (snareSynth) {
            snareSynth.triggerAttackRelease('32n', '+0', 0.3)
          }
        }
        // Next snare is 4 beats later (one measure)
        scheduleNextSnare(nextSnareTime + beatDuration * 4)
      }, delay)
    }

    // Start the first click
    scheduleNextClick(startTime)

    // Start the first snare on beat 3 (2 beats after start)
    scheduleNextSnare(startTime + beatDuration * 2)

    const groupingLength = selectedGrouping.value.length
    let eventIndex = 0
    let nextNoteTime = startTime

    const playNextNote = () => {
      if (!isPlaying.value) return

      // If we've reached the end, loop back to the beginning
      if (eventIndex >= midiEvents.value.length) {
        eventIndex = 0
      }

      const event = midiEvents.value[eventIndex]
      const durSeconds = event.duration * (60 / tempo.value / 4)

      // Update visual highlighting
      currentPlayingIndex.value = eventIndex % groupingLength

      if (useSamples.value) {
        // Play the appropriate sample using round-robin to avoid choppiness
        const isFirstNoteOfCycle = eventIndex % groupingLength === 0

        if (isFirstNoteOfCycle) {
          const player = topSamplePlayers[topPlayerIndex]
          if (player && player.loaded) {
            // Add slight scheduling offset for production stability
            const scheduleTime = '+0.01' // 10ms offset
            player.start(scheduleTime, 0, durSeconds)
          }
          topPlayerIndex = (topPlayerIndex + 1) % topSamplePlayers.length
        } else {
          const player = chugSamplePlayers[chugPlayerIndex]
          if (player && player.loaded) {
            // Add slight scheduling offset for production stability
            const scheduleTime = '+0.01' // 10ms offset
            player.start(scheduleTime, 0, durSeconds)
          }
          chugPlayerIndex = (chugPlayerIndex + 1) % chugSamplePlayers.length
        }
      } else {
        // Play MIDI tone
        if (synth) {
          const freq = Tone.Frequency(event.pitch, 'midi').toFrequency()
          synth.triggerAttackRelease(freq, durSeconds * 0.8)
        }
      }

      eventIndex++
      nextNoteTime += durSeconds * 1000

      // Schedule the next note at the precise time
      const now = performance.now()
      const delay = Math.max(0, nextNoteTime - now)
      const timeoutId = window.setTimeout(playNextNote, delay)
      activeTimeouts.push(timeoutId)
    }

    playNextNote()
  } catch (error) {
    console.error('Error in playPreview:', error)
    isPlaying.value = false
  }
}

function stopPreview() {
  isPlaying.value = false
  currentPlayingIndex.value = -1

  // Clear all timeouts to prevent overlapping samples
  activeTimeouts.forEach((id) => window.clearTimeout(id))
  activeTimeouts = []

  if (clickTimeoutId !== null) {
    window.clearTimeout(clickTimeoutId)
    clickTimeoutId = null
  }

  if (snareTimeoutId !== null) {
    window.clearTimeout(snareTimeoutId)
    snareTimeoutId = null
  }

  // Stop and dispose sample players
  topSamplePlayers.forEach((player) => {
    if (player) {
      player.stop()
      player.dispose()
    }
  })
  topSamplePlayers = []
  topPlayerIndex = 0

  chugSamplePlayers.forEach((player) => {
    if (player) {
      player.stop()
      player.dispose()
    }
  })
  chugSamplePlayers = []
  chugPlayerIndex = 0
  if (stackSamplePlayer) {
    stackSamplePlayer.stop()
    stackSamplePlayer.dispose()
    stackSamplePlayer = null
  }
  if (snareSamplePlayer) {
    snareSamplePlayer.stop()
    snareSamplePlayer.dispose()
    snareSamplePlayer = null
  }

  // Stop and dispose MIDI synths
  if (synth) {
    synth.dispose()
    synth = null
  }
  if (clickSynth) {
    clickSynth.dispose()
    clickSynth = null
  }
  if (snareSynth) {
    snareSynth.dispose()
    snareSynth = null
  }
}

// Mobile audio unlock functionality
function isMobileDevice() {
  // Check for touch capability and mobile user agents
  const hasTouchScreen =
    'ontouchstart' in window ||
    (window.navigator.maxTouchPoints && window.navigator.maxTouchPoints > 0)
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
  const smallScreen = window.innerWidth <= 768 // Consider small screens as potentially mobile

  return hasTouchScreen && (mobileUserAgent || smallScreen)
}

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) // iPad on iOS 13+
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

async function unlockAudio() {
  try {
    console.log('🔓 Attempting to unlock audio on iOS/mobile...')
    console.log('📊 Initial audio context state:', Tone.context.state)

    // Strategy 1: Native Web Audio API unlock (most aggressive for iOS)
    const audioContext = Tone.context.rawContext || Tone.context
    console.log('🎵 Using audio context:', audioContext.constructor.name)

    // Extra strategy for iOS: Try HTML5 Audio first
    if (isIOS()) {
      console.log('🍎 Trying HTML5 Audio unlock for iOS...')
      try {
        const audio = new Audio()
        audio.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
        console.log('✅ HTML5 Audio unlock attempted')
      } catch (htmlAudioError) {
        console.warn('⚠️ HTML5 Audio unlock failed:', htmlAudioError)
      }
    }

    if (audioContext.state === 'suspended') {
      console.log('🔄 Resuming suspended audio context...')
      await audioContext.resume()
      console.log('✅ Audio context resumed, state:', audioContext.state)
    }

    // Strategy 2: Create and play a native audio buffer to fully unlock iOS
    console.log('🎯 Creating native audio buffer for iOS unlock...')
    const buffer = audioContext.createBuffer(1, 44100 * 0.1, 44100) // 100ms buffer
    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()

    // Fill buffer with a very quiet sine wave
    const channelData = buffer.getChannelData(0)
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.01 // Very quiet 440Hz
    }

    source.buffer = buffer
    gainNode.gain.value = 0.1 // Even quieter
    source.connect(gainNode)
    gainNode.connect(audioContext.destination as AudioDestinationNode)

    source.start(0)
    source.stop(audioContext.currentTime + 0.1)

    console.log('🎵 Native audio buffer played for iOS unlock')

    // Strategy 3: Start Tone.js context after native unlock
    await Tone.start()
    console.log('🎹 Tone.js started, context state:', Tone.context.state)

    // Strategy 4: Test with Tone.js oscillator
    if (Tone.context.state === 'running') {
      console.log('🧪 Testing with Tone.js oscillator...')
      const testOsc = new Tone.Oscillator(440, 'sine').toDestination()
      testOsc.volume.value = -20 // Audible but not too loud
      testOsc.start()
      testOsc.stop('+0.2') // Play for 200ms

      // Wait for the test to complete
      await new Promise((resolve) => setTimeout(resolve, 300))
      testOsc.dispose()
      console.log('✅ Tone.js oscillator test completed')

      // Strategy 5: For iOS with samples, do a quick sample test
      if (isIOS() && useSamples.value) {
        console.log('🍎 Testing sample loading on iOS...')
        try {
          const testPlayer = new Tone.Player().toDestination()
          await testPlayer.load('/samples/top.mp3')
          testPlayer.volume.value = -40
          testPlayer.start()
          testPlayer.stop('+0.1')

          setTimeout(() => {
            testPlayer.dispose()
            console.log('✅ iOS sample test completed')
          }, 200)
        } catch (sampleError) {
          console.warn('⚠️ iOS sample test failed, will use MIDI fallback:', sampleError)
        }
      }

      audioUnlocked.value = true
      showAudioUnlock.value = false
      console.log('🎉 Audio unlock completed successfully!')
    } else {
      throw new Error(`❌ Audio context state is still ${Tone.context.state} after unlock attempts`)
    }
  } catch (error) {
    console.error('❌ Primary unlock method failed:', error)

    // Last resort: Force everything and hope for the best
    try {
      console.log('🚨 Trying last resort unlock method...')

      // Force resume any suspended contexts
      const contexts = [Tone.context.rawContext, Tone.context]
      for (const ctx of contexts) {
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume()
          console.log('🔄 Force resumed context:', ctx.constructor.name)
        }
      }

      // Mark as unlocked regardless - let the user try
      audioUnlocked.value = true
      showAudioUnlock.value = false
      console.log('🤞 Marked as unlocked, user can try playing audio')
    } catch (finalError) {
      console.error('💥 All unlock methods failed:', finalError)
      showAudioUnlock.value = false
    }
  }
}

// Force unlock function - even more aggressive iOS audio unlock
async function forceUnlockAudio() {
  try {
    console.log('🚨 FORCE UNLOCK: Starting extremely aggressive iOS audio unlock...')

    // Method 1: Multiple HTML5 audio elements with different approaches
    console.log('📱 Trying multiple HTML5 audio unlock strategies...')
    const formats = [
      'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAACB',
      'data:audio/mpeg;base64,//MkxAAHiAJjgBwAAFgGDbcILGCDUiCDUjUiEGdQ==',
      '', // Empty source
    ]

    for (const format of formats) {
      try {
        const audio = new Audio()
        if (format) audio.src = format
        audio.volume = 0.001
        audio.loop = false
        audio.muted = false
        audio.preload = 'auto'

        const playPromise = audio.play()
        if (playPromise) {
          await playPromise.catch(() => {})
        }

        setTimeout(() => {
          audio.pause()
          audio.currentTime = 0
        }, 50)

        console.log('✅ Force unlock: HTML5 audio attempt succeeded')
      } catch (audioError) {
        console.warn('⚠️ Force unlock: HTML5 audio failed:', audioError)
      }
    }

    // Method 2: Create fresh AudioContext and test multiple frequencies
    console.log('🔊 Creating fresh AudioContext for force unlock...')
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const forceContext = new AudioContext()

      if (forceContext.state === 'suspended') {
        await forceContext.resume()
      }

      // Test multiple frequencies simultaneously
      const frequencies = [220, 440, 880]
      for (const freq of frequencies) {
        const osc = forceContext.createOscillator()
        const gain = forceContext.createGain()

        osc.frequency.setValueAtTime(freq, forceContext.currentTime)
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.005, forceContext.currentTime)

        osc.connect(gain)
        gain.connect(forceContext.destination)

        osc.start(forceContext.currentTime)
        osc.stop(forceContext.currentTime + 0.1)
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
      await forceContext.close()
      console.log('✅ Force unlock: Fresh AudioContext test completed')
    } catch (webAudioError) {
      console.warn('⚠️ Force unlock: Fresh AudioContext failed:', webAudioError)
    }

    // Method 3: Force Tone.js restart
    console.log('🎹 Force restarting Tone.js...')
    try {
      // Try to dispose current context
      try {
        if (Tone.context && Tone.context.rawContext) {
          const rawContext = Tone.context.rawContext as any
          if (rawContext.close) {
            await rawContext.close()
          }
        }
      } catch (closeError) {
        console.warn('⚠️ Could not close context:', closeError)
      }

      // Force restart
      await Tone.start()
      console.log('✅ Tone.js force restart completed, state:', Tone.context.state)

      // Test with multiple Tone.js instruments
      if (Tone.context.state === 'running') {
        const testOsc = new Tone.Oscillator(440, 'triangle').toDestination()
        testOsc.volume.value = -40
        testOsc.start()
        testOsc.stop('+0.05')

        setTimeout(() => testOsc.dispose(), 100)
        console.log('✅ Force unlock: Tone.js test succeeded')
      }
    } catch (toneError) {
      console.warn('⚠️ Force unlock: Tone.js restart failed:', toneError)
    }

    // Method 4: Canvas and touch event simulation
    console.log('🖱️ Simulating additional user interactions...')
    try {
      // Create multiple touch/click events
      const events = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click']
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true })
        document.dispatchEvent(event)
      }

      // Canvas interaction
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = 1
        canvas.height = 1
        ctx.fillRect(0, 0, 1, 1)
      }

      console.log('✅ Force unlock: User interaction simulation completed')
    } catch (interactionError) {
      console.warn('⚠️ Force unlock: Interaction simulation failed:', interactionError)
    }

    // Wait for everything to settle
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mark as unlocked regardless
    audioUnlocked.value = true
    showAudioUnlock.value = false

    console.log('🎉 FORCE UNLOCK COMPLETED! Audio context state:', Tone.context.state)

    // Show result to user
    const contextState = Tone.context.state
    const message =
      contextState === 'running'
        ? 'Force unlock succeeded! Audio should work now.'
        : `Force unlock completed. Context is ${contextState}. Try playing audio - it may still work.`

    alert(message)
  } catch (error) {
    console.error('💥 Force unlock failed:', error)

    // Ultimate fallback
    audioUnlocked.value = true
    showAudioUnlock.value = false
    alert('Force unlock had errors, but audio may still work. Try playing something!')
  }
}

// Debug function for iOS audio troubleshooting
function debugAudioState() {
  console.log('🔍 iOS AUDIO DEBUG INFO:')
  console.log('📱 Device Detection:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    isIOS: isIOS(),
    isSafari: isSafari(),
    isMobile: isMobileDevice(),
  })

  console.log('🎵 Audio Context Info:', {
    toneContextState: Tone.context.state,
    rawContextState: Tone.context.rawContext?.state,
    contextConstructor: Tone.context.constructor.name,
    rawContextConstructor: Tone.context.rawContext?.constructor.name,
    sampleRate: Tone.context.sampleRate,
    currentTime: Tone.context.currentTime,
  })

  console.log('🔧 App State:', {
    audioUnlocked: audioUnlocked.value,
    useSamples: useSamples.value,
    isPlaying: isPlaying.value,
    showAudioUnlock: showAudioUnlock.value,
  })

  // Test if we can create audio nodes
  try {
    const testOsc = Tone.context.createOscillator()
    console.log('✅ Can create oscillator:', !!testOsc)
    testOsc.disconnect()
  } catch (e) {
    console.error('❌ Cannot create oscillator:', e)
  }

  // Alert the user with key info
  alert(`iOS Debug Info:
Device: ${isIOS() ? 'iOS' : 'Not iOS'}
Browser: ${isSafari() ? 'Safari' : 'Other'}
Audio Context: ${Tone.context.state}
Raw Context: ${Tone.context.rawContext?.state || 'N/A'}
Audio Unlocked: ${audioUnlocked.value}

Check console for detailed info.`)
}

// Check if we need to show audio unlock on mobile
function checkAudioUnlockNeeded() {
  const isMobile = isMobileDevice()
  const isiOS = isIOS()
  const needsUnlock =
    (isMobile || isiOS) && !audioUnlocked.value && Tone.context.state !== 'running'

  if (needsUnlock) {
    console.log('🔒 Mobile/iOS device detected with locked audio context, showing unlock modal')
    console.log('📱 Device info:', {
      userAgent: navigator.userAgent,
      touchPoints: window.navigator.maxTouchPoints,
      screenWidth: window.innerWidth,
      isMobile: isMobile,
      isIOS: isiOS,
      isSafari: isSafari(),
      toneState: Tone.context.state,
      platform: navigator.platform,
    })
    showAudioUnlock.value = true
  } else {
    console.log('✅ Audio unlock not needed:', {
      isMobile: isMobile,
      isIOS: isiOS,
      audioUnlocked: audioUnlocked.value,
      toneState: Tone.context.state,
    })
  }
}

// Initialize mobile detection on component mount
onMounted(() => {
  console.log('🚀 THIRTYTHR33 Component mounted')
  console.log('📱 Device info:', {
    userAgent: navigator.userAgent,
    touchPoints: window.navigator.maxTouchPoints,
    screenWidth: window.innerWidth,
    isMobile: isMobileDevice(),
    isIOS: isIOS(),
  })

  // Check if we need audio unlock after a short delay to ensure DOM is ready
  setTimeout(() => {
    console.log('🔍 Checking audio unlock needed...')
    checkAudioUnlockNeeded()
  }, 100)

  // Also check when user first interacts with any button that might trigger audio
  const handleFirstClick = () => {
    console.log('👆 First click detected')
    if (!audioUnlocked.value && isMobileDevice()) {
      checkAudioUnlockNeeded()
    }
  }

  // Listen for clicks on play buttons specifically
  document.addEventListener('click', handleFirstClick, { once: true })
})
</script>
