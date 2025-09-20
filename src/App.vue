<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Polyrhythm Generator</h1>
    <div class="space-y-2">
      <label class="block">Tempo (BPM):</label>
      <input v-model.number="tempo" type="number" class="border p-2 rounded w-32" />

      <label class="block">Host Time Signature (ex: 4/4):</label>
      <input v-model="hostTimeSig" type="text" class="border p-2 rounded w-32" />

      <label class="block">Guest Cycle Length (ex: 33/16):</label>
      <input v-model="guestCycle" type="text" class="border p-2 rounded w-32" />

      <label class="block">Phrase Length (bars):</label>
      <input v-model.number="phraseBars" type="number" class="border p-2 rounded w-32" />

      <label class="block">Pitch (MIDI note, F#=42):</label>
      <input v-model.number="pitch" type="number" class="border p-2 rounded w-32" />
    </div>

    <div>
      <button @click="generateGroupings" class="px-4 py-2 bg-blue-500 text-white rounded">
        Generate Groupings
      </button>
    </div>

    <div v-if="groupings.length">
      <h2 class="font-semibold">Select a grouping:</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(g, i) in groupings"
          :key="i"
          @click="selectGrouping(g)"
          class="px-3 py-1 rounded border"
          :class="{ 'bg-green-300': selectedGrouping === g }"
        >
          {{ g.join('-') }}
        </button>
      </div>
    </div>

    <div v-if="selectedGrouping">
      <h2 class="font-semibold">Selected grouping: {{ selectedGrouping.join('-') }}</h2>
      <p>Full cycles: {{ fullCycles }}</p>
      <p>Truncation length: {{ truncation }}/16</p>
      <button
        v-if="midiUrl"
        @click="downloadMIDI"
        class="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Download MIDI
      </button>
      <button
        v-if="midiEvents.length"
        @click="playMIDI"
        class="px-4 py-2 bg-green-600 text-white rounded"
      >
        Play
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as MidiWriter from 'midi-writer-js'
import * as Tone from 'tone'

const tempo = ref(120)
const hostTimeSig = ref('4/4')
const guestCycle = ref('33/16')
const phraseBars = ref(8)
const pitch = ref(42)

const groupings = ref<number[][]>([])
const selectedGrouping = ref<number[] | null>(null)
const truncation = ref<number>(0)
const fullCycles = ref<number>(0)
const midiUrl = ref<string | null>(null)
const midiEvents = ref<{ pitch: number; duration: number }[]>([])

function generateGroupings() {
  const [num, denom] = guestCycle.value.split('/').map(Number)
  if (denom !== 16) {
    alert('Only 16th-note based guests supported for now')
    return
  }
  const rawGroupings: number[][] = []
  generatePartitions(num, [3, 5, 7, 9], [], rawGroupings)

  groupings.value = rawGroupings.filter((g) => {
    const unique = new Set(g)
    if (unique.size <= 1) return false
    if (!(unique.has(5) || unique.has(7))) return false
    if (hasTooManyConsecutive(g, 3, 5)) return false
    return true
  })
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

function selectGrouping(g: number[]) {
  selectedGrouping.value = g
  generateMIDI() // automatically generate MIDI in memory
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
  a.download = 'polyrhythm.mid'
  a.click()
}

async function playMIDI() {
  if (!midiEvents.value.length) return
  await Tone.start()
  const synth = new Tone.Synth().toDestination()
  let now = Tone.now()
  for (let e of midiEvents.value) {
    const durSeconds = e.duration * (60 / tempo.value / 4) // 16th-note duration in seconds
    synth.triggerAttackRelease(Tone.Frequency(e.pitch, 'midi'), durSeconds, now)
    now += durSeconds
  }
}
</script>
