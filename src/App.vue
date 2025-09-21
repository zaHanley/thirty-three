<template>
  <div class="p-6 space-y-4 max-w-3xl mx-auto mt-10">
    <h1 class="text-4xl font-bold">33</h1>
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
        class="btn btn-sm btn-primary text-primary-content rounded"
      >
        Generate Groupings
      </button>
    </div>

    <div v-if="groupings.length">
      <h2 class="font-semibold">Select a grouping:</h2>
      <div class="flex flex-wrap gap-2 rounded bord">
        <button
          v-for="(g, i) in groupings"
          :key="i"
          @click="selectGrouping(g)"
          class="btn btn-xs px-3 py-1 rounded border"
          :class="{
            'btn-success text-success-content': selectedGrouping === g && !isPlaying,
            'btn-error': selectedGrouping === g && isPlaying,
          }"
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
import { ref } from 'vue'
import * as MidiWriter from 'midi-writer-js'
import * as Tone from 'tone'

const tempo = ref(120)
const hostTimeSig = ref('4/4')
const guestCycle = ref('19/16')
const phraseBars = ref(8)
const pitch = ref(42)
const maxRepeat = ref(1)

const groupings = ref<number[][]>([])
const selectedGrouping = ref<number[] | null>(null)
const truncation = ref<number>(0)
const fullCycles = ref<number>(0)
const midiUrl = ref<string | null>(null)
const midiEvents = ref<{ pitch: number; duration: number }[]>([])
const isPlaying = ref(false)
let synth: Tone.PolySynth | null = null
let clickSynth: Tone.MetalSynth | null = null
let clickLoop: Tone.Loop | null = null

function generateGroupings() {
  const [num, denom] = guestCycle.value.split('/').map(Number)
  if (denom !== 16) {
    alert('Only 16th-note based guests supported for now')
    return
  }
  const rawGroupings: number[][] = []
  generatePartitions(num, [2, 3, 5, 7, 9], [], rawGroupings)

  groupings.value = rawGroupings.filter((g) => {
    const unique = new Set(g)
    if (unique.size <= 1) return false
    if (!(unique.has(5) || unique.has(7))) return false
    if (hasTooManyConsecutive(g, 2, maxRepeat.value)) return false
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

async function selectGrouping(g: number[]) {
  selectedGrouping.value = g
  generateMIDI()
  if (isPlaying.value) {
    stopPreview()
  } else {
    await playPreview()
  }
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
