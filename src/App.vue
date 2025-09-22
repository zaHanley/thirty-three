<template>
  <div class="p-6 space-y-4 max-w-3xl mx-auto mt-10">
    <h1 class="text-4xl font-bold">THIRTYTHR33</h1>
    <div class="flex flex-row gap-1 w-full">
      <div class="flex flex-col gap-1">
        <label class="input rounded">
          <span class="text-secondary">Tempo</span>
          <input v-model.number="tempo" type="number" placeholder="120" />
        </label>
        <label class="input rounded">
          <span class="text-secondary">Host</span>
          <input v-model="hostTimeSig" type="text" placeholder="4/4" />
        </label>
        <label class="input rounded">
          <span class="text-secondary">Guest</span>
          <input v-model="guestCycle" type="text" placeholder="19/16" />
        </label>
      </div>
      <div class="flex flex-col gap-1">
        <label class="input rounded">
          <span class="text-secondary">Bars</span>
          <input v-model.number="phraseBars" type="number" placeholder="8" />
        </label>
        <label class="input rounded">
          <span class="text-secondary">Pitch</span>
          <input v-model.number="pitch" type="number" placeholder="41" />
        </label>
        <label class="input rounded">
          <span class="text-secondary">Max Repeat</span>
          <input v-model.number="maxRepeat" type="number" placeholder="3" />
        </label>
      </div>
    </div>

    <div>
      <button
        @click="generateGroupings"
        :disabled="isGenerating"
        class="btn btn-sm btn-primary text-primary-content rounded"
      >
        <span v-if="isGenerating" class="animate-pulse"
          >This is so many possibilities, dude. Use the filters.</span
        >
        <span v-else>Generate</span>
      </button>
    </div>

    <!-- Partition selection controls -->
    <div class="mb-4 p-3 bg-base-200 rounded">
      <h3 class="text-sm font-medium mb-2">Enabled Durations:</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="partitionValue in [1, 2, 3, 4, 5, 6, 7, 9]"
          :key="partitionValue"
          @click="togglePartition(partitionValue)"
          class="btn btn-xs rounded"
          :class="{
            'btn-primary': enabledPartitions.has(partitionValue),
            'btn-outline': !enabledPartitions.has(partitionValue),
          }"
        >
          {{ partitionValue }}
        </button>
      </div>
    </div>

    <div v-if="groupings.length">
      <h2 class="font-semibold">Select a grouping:</h2>

      <!-- Group visibility controls -->
      <div class="mb-4 p-3 bg-base-200 rounded">
        <h3 class="text-sm font-medium mb-2">Show/Hide Groups:</h3>
        <div class="flex flex-wrap gap-2">
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

      <div class="space-y-2">
        <details
          v-for="firstValue in [1, 2, 3, 4, 5, 6, 7, 9].filter((v) => groupCounts[v] > 0)"
          :key="firstValue"
          class="collapse bg-base-100 border-base-300 border"
          :class="{ hidden: !visibleGroups.has(firstValue) }"
        >
          <summary class="collapse-title font-semibold">
            Starting with {{ firstValue }} ({{ groupCounts[firstValue] }} groupings)
          </summary>
          <div class="collapse-content">
            <div class="flex flex-wrap gap-2 p-2">
              <button
                v-for="(g, i) in groupedGroupings[firstValue] || []"
                :key="`${firstValue}-${i}`"
                @click="selectGrouping(g)"
                class="btn btn-xs px-3 py-1 rounded border"
                :class="{
                  'btn-primary text-success-content': selectedGrouping === g && !isPlaying,
                  'btn-error': selectedGrouping === g && isPlaying,
                }"
              >
                {{ g.join('-') }}
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div v-if="selectedGrouping">
      <h2 class="font-semibold">Selected grouping: {{ selectedGrouping.join('-') }}</h2>
      <p>Full cycles: {{ fullCycles }}</p>
      <p>Truncation length: {{ truncation }}/16</p>
      <button
        v-if="midiUrl"
        @click="downloadMIDI"
        class="btn px-4 py-2 bg-purple-600 text-white rounded"
      >
        Download MIDI
      </button>
      <button
        v-if="midiEvents.length && !isPlaying"
        @click="isPlaying ? stopPreview() : playPreview()"
        class="btn px-4 py-2 bg-green-600 text-white rounded"
        :class="{ 'bg-warning text-success-content': isPlaying }"
      >
        Play
      </button>
      <button
        v-if="isPlaying"
        @click="stopPreview"
        class="btn px-4 py-2 bg-red-600 text-white rounded"
      >
        Stop
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as MidiWriter from 'midi-writer-js'
import * as Tone from 'tone'

const tempo = ref(120)
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
let synth: Tone.PolySynth | null = null
let clickSynth: Tone.MetalSynth | null = null
let clickLoop: Tone.Loop | null = null

const groupCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const firstValue of [1, 2, 3, 4, 5, 6, 7, 9]) {
    counts[firstValue] = groupedGroupings.value[firstValue]?.length || 0
  }
  return counts
})

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
  if (isPlaying.value && selectedGrouping.value === g) {
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
  if (!midiEvents.value.length) return
  await Tone.start()
  stopPreview()
  isPlaying.value = true

  synth = new Tone.PolySynth().toDestination()
  clickSynth = new Tone.MetalSynth().toDestination()

  const [hostNum, hostDen] = hostTimeSig.value.split('/').map(Number)
  const beatDuration = 60 / tempo.value

  // Schedule 4/4 metronome clicks
  clickLoop = new Tone.Loop((time) => {
    if (clickSynth) clickSynth.triggerAttackRelease('C-2', '8n', time, 0.25)
  }, beatDuration).start(0)

  let now = Tone.now()
  for (let e of midiEvents.value) {
    const durSeconds = e.duration * (60 / tempo.value / 4)
    if (synth) synth.triggerAttackRelease(Tone.Frequency(e.pitch, 'midi'), durSeconds, now)
    now += durSeconds
  }
  Tone.Transport.start()
}

function stopPreview() {
  isPlaying.value = false
  if (synth) {
    synth.dispose()
    synth = null
  }
  if (clickSynth) {
    clickSynth.dispose()
    clickSynth = null
  }
  if (clickLoop) {
    clickLoop.dispose()
    clickLoop = null
  }
  Tone.Transport.stop()
}
</script>
