<template>
  <div class="min-h-screen overflow-y-scroll">
    <!-- Sticky Controls Header -->
    <div class="sticky top-0 z-10 bg-base-100 border-b border-base-300 shadow-md">
      <div class="p-4 max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-2xl font-bold">THIRTYTHR33</h1>
          <button @click="isControlsExpanded = !isControlsExpanded" class="btn btn-xs btn-circle">
            <span v-if="isControlsExpanded">−</span>
            <span v-else>+</span>
          </button>
        </div>

        <div v-show="isControlsExpanded" class="space-y-3">
          <div class="flex gap-3 w-full">
            <!-- Input fields section -->
            <div class="flex-[2] p-2 bg-base-200 rounded">
              <div class="flex flex-row gap-1 w-full">
                <div class="flex flex-col gap-1">
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Tempo</span>
                    <input v-model.number="tempo" type="number" placeholder="120" class="text-sm" />
                  </label>
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Host</span>
                    <input v-model="hostTimeSig" type="text" placeholder="4/4" class="text-sm" />
                  </label>
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Guest</span>
                    <input v-model="guestCycle" type="text" placeholder="19/16" class="text-sm" />
                  </label>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Bars</span>
                    <input
                      v-model.number="phraseBars"
                      type="number"
                      placeholder="8"
                      class="text-sm"
                    />
                  </label>
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Pitch</span>
                    <input v-model.number="pitch" type="number" placeholder="41" class="text-sm" />
                  </label>
                  <label class="input input-sm rounded">
                    <span class="text-secondary text-xs">Max Repeat</span>
                    <input
                      v-model.number="maxRepeat"
                      type="number"
                      placeholder="3"
                      class="text-sm"
                    />
                  </label>
                </div>
              </div>
            </div>

            <!-- Partition selection controls -->
            <div class="flex-1 p-2 bg-base-200 rounded">
              <h3 class="text-xs font-medium mb-1">Enabled Durations:</h3>
              <div class="flex flex-col gap-1">
                <div class="flex gap-1">
                  <button
                    v-for="partitionValue in [1, 2, 3, 4]"
                    :key="partitionValue"
                    @click="togglePartition(partitionValue)"
                    class="btn btn-xs rounded flex-1"
                    :class="{
                      'btn-primary': enabledPartitions.has(partitionValue),
                      'btn-outline': !enabledPartitions.has(partitionValue),
                    }"
                  >
                    {{ partitionValue }}
                  </button>
                </div>
                <div class="flex gap-1">
                  <button
                    v-for="partitionValue in [5, 6, 7, 9]"
                    :key="partitionValue"
                    @click="togglePartition(partitionValue)"
                    class="btn btn-xs rounded flex-1"
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

          <div class="flex gap-2 items-center">
            <button
              @click="generateGroupings"
              :disabled="isGenerating"
              class="btn btn-sm btn-primary text-primary-content rounded"
            >
              <span v-if="isGenerating" class="animate-pulse"
                >Be patient, you can't even count this high</span
              >
              <span v-else>Generate</span>
            </button>

            <button
              v-if="groupings.length > 0"
              @click="selectRandomGrouping"
              class="btn btn-sm btn-secondary rounded"
            >
              Random
            </button>

            <!-- Action buttons that appear when grouping is selected -->
            <div v-if="selectedGrouping" class="flex gap-2">
              <button
                v-if="midiUrl"
                @click="downloadMIDI"
                class="btn btn-sm bg-purple-600 text-white rounded"
              >
                Download MIDI
              </button>
              <button
                v-if="midiEvents.length && !isPlaying"
                @click="playPreview()"
                class="btn btn-sm bg-green-600 text-white rounded"
              >
                Play
              </button>
              <button
                v-if="isPlaying"
                @click="stopPreview"
                class="btn btn-sm bg-red-600 text-white rounded"
              >
                Stop
              </button>
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
          <div v-if="groupings.length" class="p-2 bg-base-200 rounded">
            <h3 class="text-xs font-medium mb-1">Show/Hide Groups:</h3>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="firstValue in [1, 2, 3, 4, 5, 6, 7, 9]"
                :key="firstValue"
                @click="toggleGroupVisibility(firstValue)"
                class="btn btn-xs rounded"
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
    <div class="p-6 max-w-3xl mx-auto space-y-4">
      <div v-if="groupings.length">
        <h2 class="font-semibold mb-4">Select a grouping:</h2>

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
              <div class="flex flex-wrap gap-2 p-2 max-h-40 overflow-y-auto">
                <button
                  v-for="(g, i) in groupedGroupings[firstValue] || []"
                  :key="`${firstValue}-${i}`"
                  @click="selectGrouping(g)"
                  class="btn btn-neutral btn-xs px-3 py-1 rounded border"
                  :class="{
                    'text-primary': selectedGrouping === g && !isPlaying,
                    'text-error': selectedGrouping === g && isPlaying,
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
import { ref, computed } from 'vue'
import * as MidiWriter from 'midi-writer-js'
import * as Tone from 'tone'

const tempo = ref(130)
const hostTimeSig = ref('4/4')
const guestCycle = ref('19/16')
const phraseBars = ref(8)
const pitch = ref(42)
const maxRepeat = ref(1)

const isGenerating = ref(false)
const enabledPartitions = ref(new Set([2, 3, 5, 7, 9]))
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
let synth: Tone.PolySynth | null = null
let clickSynth: Tone.MetalSynth | null = null
let snareSynth: Tone.NoiseSynth | null = null
let clickLoop: Tone.Loop | null = null

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

  await Tone.start()
  stopPreview()

  isPlaying.value = true
  currentPlayingIndex.value = 0

  synth = new Tone.PolySynth().toDestination()
  clickSynth = new Tone.MetalSynth().toDestination()
  snareSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
  }).toDestination()

  // Start both the metronome and main playback at exactly the same time
  const startTime = performance.now()
  const beatDuration = (60 / tempo.value) * 1000 // Convert to milliseconds

  // Metronome that stays in sync
  function scheduleNextClick(nextClickTime: number) {
    if (!isPlaying.value) return

    const now = performance.now()
    const delay = Math.max(0, nextClickTime - now)

    setTimeout(() => {
      if (!isPlaying.value) return
      if (clickSynth) {
        clickSynth.triggerAttackRelease('C-2', '32n', '+0', 0.1)
      }
      scheduleNextClick(nextClickTime + beatDuration)
    }, delay)
  }

  // Snare on beat 3 of each measure (assuming 4/4 time)
  function scheduleNextSnare(nextSnareTime: number) {
    if (!isPlaying.value) return

    const now = performance.now()
    const delay = Math.max(0, nextSnareTime - now)

    setTimeout(() => {
      if (!isPlaying.value) return
      if (snareSynth) {
        snareSynth.triggerAttackRelease('32n', '+0', 0.3)
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

  function playNextNote() {
    if (!isPlaying.value) return

    // If we've reached the end, loop back to the beginning
    if (eventIndex >= midiEvents.value.length) {
      eventIndex = 0
    }

    const event = midiEvents.value[eventIndex]
    const durSeconds = event.duration * (60 / tempo.value / 4)

    // Update visual highlighting
    currentPlayingIndex.value = eventIndex % groupingLength

    // Play the note
    if (synth) {
      const freq = Tone.Frequency(event.pitch, 'midi').toFrequency()
      synth.triggerAttackRelease(freq, durSeconds * 0.8)
    }

    eventIndex++
    nextNoteTime += durSeconds * 1000

    // Schedule the next note at the precise time
    const now = performance.now()
    const delay = Math.max(0, nextNoteTime - now)
    setTimeout(playNextNote, delay)
  }

  playNextNote()
}

function stopPreview() {
  isPlaying.value = false
  currentPlayingIndex.value = -1

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
</script>
