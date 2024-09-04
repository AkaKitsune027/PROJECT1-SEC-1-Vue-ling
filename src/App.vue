<script setup>

import { ref, computed, onMounted, watch } from 'vue'

import Mouse from './classes/Mouse.js'
import Card from './classes/Card.js'

//sounds
const bgmAudioSource = new Audio()
bgmAudioSource.volume = 0.15

const sfxAudioSource = new Audio()
sfxAudioSource.volume = 0.15

const isBgmPlaying = ref(false)

function playSound(type, src) {
  if (type === 'bgm') {
    isBgmPlaying.value = true
    bgmAudioSource.src = src
    bgmAudioSource.loop = true
    bgmAudioSource.play()
  } else {
    sfxAudioSource.src = src
    sfxAudioSource.loop = false
    sfxAudioSource.play()
  }
}

function stopSound(type) {
  if (type === 'bgm') {
    bgmAudioSource.pause()
    bgmAudioSource.currentTime = 0
  } else {
    sfxAudioSource.pause()
    sfxAudioSource.currentTime = 0
  }
}

function toggleBgm() {
  if (isBgmPlaying.value) {
    bgmAudioSource.pause()
  } else {
    bgmAudioSource.play()
  }
  isBgmPlaying.value = !isBgmPlaying.value

  isRed.value = !isRed.value
}

// Current page
const currentPage = ref('home')

const isBoardLoading = ref(false)

// Card types array
const typesArray = [
  ...Array(10).fill('plate'),
  ...Array(7).fill('spring'),
  ...Array(6).fill('peanut'),
  ...Array(2).fill('cheddar-cheese'),
  ...Array(2).fill('gouda-cheese'),
  ...Array(2).fill('swiss-cheese'),
  ...Array(4).fill('glue'),
  ...Array(3).fill('cat')
]

const cards = ref([])
const selectedMouse = ref(null)
const currentPlayerFaction = ref('white')
const winnerModalOpenState = ref(false)
const manualModalOpenState = ref(false)
const noplateToUseCheeseModal = ref(false)
const useSameCheeseModal = ref(false)
const storyModal = ref(false)
const winnerMessage = ref('') // New ref for winner message

const highlightedCells = ref([])

const playerStuckMouse = ref({
  'white': null,
  'black': null
})
const playerStuckModal = ref({
  'white': false,
  'black': false
})

const usedCheeses = ref({
  'white': {
    'cheddar-cheese': false,
    'gouda-cheese': false,
    'swiss-cheese': false
  },
  'black': {
    'cheddar-cheese': false,
    'gouda-cheese': false,
    'swiss-cheese': false
  }
})

const manualSelectedTab = ref(0)

/**
 * Setup the board
 */
function setupBoard() {
  Card.resetId()
  isBoardLoading.value = true
  const shuffledTypes = [...typesArray].sort(() => Math.random() - 0.5)

  for (let r = 0; r < 6; r++) {
    const row = []

    for (let c = 0; c < 6; c++) {
      const card = new Card(shuffledTypes.pop())
      let mouse = null

      if (card.id === 0) mouse = new Mouse('white', 'king')
      else if (card.id === 1 || card.id === 6) mouse = new Mouse('white', 'soldier')
      else if (card.id === 29 || card.id === 34) mouse = new Mouse('black', 'soldier')
      else if (card.id === 35) mouse = new Mouse('black', 'king')

      card.mouse = mouse
      row.push(card)
    }
    cards.value.push(row)
  }

  isBoardLoading.value = false
}

/**
 * Total white mouses
 */
const totalWhiteMouses = computed(() => {
  return cards.value.flat().filter((c) => c.mouse?.faction === 'white' && c.mouse.type === 'soldier').length
})

/**
 * Total black mouses
 */
const totalBlackMouses = computed(() => {
  return cards.value.flat().filter((c) => c.mouse?.faction === 'black' && c.mouse.type === 'soldier').length
})

/**
 * Trigger card event
 * @param {Card} card - The card that was clicked
 */
const triggerCardEvent = (card) => {
  if (card.type !== 'spring') selectedMouse.value.disableCards = []

  if (card.type === 'cat') {
    card.mouse = null
  } else if (card.type === 'spring') {
    for (const card of cards.value.flat().filter(c => {
      return (c.mouse && c.mouse.faction === currentPlayerFaction.value
        && c.mouse !== selectedMouse.value)
    })) {
      card.mouse.isDisabled = true
    }

    card.mouse.disableCards.push(card)

    if (card.mouse.availableMoves.every(cardId => card.mouse.validateMove(cards.value.flat()[cardId]) === false)) {
      selectedMouse.value.disableCards = []
    }

  } else if (card.type === 'peanut') {
    selectedMouse.value.isDisabled = true

  } else if (card.type === 'glue') {
    selectedMouse.value.isStuck = true
    playerStuckMouse.value[currentPlayerFaction.value] = selectedMouse.value

    const opponentFaction = currentPlayerFaction.value === 'white' ? 'black' : 'white'

    if (playerStuckMouse.value[opponentFaction] && playerStuckMouse.value[opponentFaction].card.id === card.id) {
      playerStuckMouse.value[opponentFaction] = null
    }

  } else if (['cheddar-cheese', 'gouda-cheese', 'swiss-cheese'].includes(card.type) && selectedMouse.value.type === 'king') {

    const faction = currentPlayerFaction.value
    const cheeseType = card.type

    if (usedCheeses.value[faction][cheeseType]) {
      useSameCheeseModal.value = true
      return
    }

    const availablePlateCards = cards.value.flat().filter(c => c.isReveal && c.type === 'plate' && c.mouse === null)

    if (availablePlateCards.length === 0) {
      noplateToUseCheeseModal.value = true
      return
    }

    const newMouseCardIndex = availablePlateCards.length > 1 ? Math.round(Math.random() * (availablePlateCards.length - 1)) : 0

    availablePlateCards[newMouseCardIndex].mouse = new Mouse(faction, 'soldier')

    if (availablePlateCards[newMouseCardIndex].mouse) usedCheeses.value[faction][cheeseType] = true

  }
}

/**
 * Switch turn between white and black
 */
function switchTurn() {
  if (cards.value.flat().filter(c => c.mouse && c.mouse.faction === currentPlayerFaction.value).some((c => c.mouse.isDisabled))) return
  currentPlayerFaction.value = currentPlayerFaction.value === 'white' ? 'black' : 'white'

  if (playerStuckMouse.value[currentPlayerFaction.value]) {
    playerStuckModal.value[currentPlayerFaction.value] = true
  }
}

const handleStuckModalSubmit = () => {
  playerStuckMouse.value[currentPlayerFaction.value].isStuck = false
  playerStuckMouse.value[currentPlayerFaction.value] = null
  playerStuckModal.value[currentPlayerFaction.value] = false
  switchTurn()
}

let selectMouse
/**
 * This function is called when a card is clicked.
 * @param {Card} selectedCard - The card that was clicked
 */
const handleSelectCard = async (selectedCard) => {

  // If selected card has a mouse that it belongs to the current player and not in disable state, select it.
  if (selectedCard.mouse && selectedCard.mouse.faction === currentPlayerFaction.value && selectedCard.mouse.isDisabled === false) {
    selectedMouse.value = selectedCard.mouse

  } else if (selectedMouse.value) { // If a mouse is selected, move it to the selected card.
    if (await selectedMouse.value.moveTo(selectedCard)) {  // If the move is successful, switch turn.

      const currentPlayerMouses = []

      for (const c of cards.value.flat()) {
        if (c.mouse && c.mouse.faction === currentPlayerFaction.value) {
          currentPlayerMouses.push(c.mouse)
        }
        continue
      }

      for (const m of currentPlayerMouses) {
        m.isDisabled = false
      }


      triggerCardEvent(selectedCard)
      switchTurn()
      selectedMouse.value = null
    }
  }

}

/**
 * Start the game
 */
const startGame = () => {
  storyModal.value = true
  setupBoard()
  currentPlayerFaction.value = Math.random() < 0.5 ? 'white' : 'black'
  currentPage.value = 'game' // Switch to game page

  playSound('bgm', '/sounds/background-sound.mp3')


}

// Computed properties to check for king mice existence
const kingsExist = computed(() => ({
  white: cards.value.flat().some(c => c.mouse?.faction === 'white' && c.mouse.type === 'king'),
  black: cards.value.flat().some(c => c.mouse?.faction === 'black' && c.mouse.type === 'king')
}))

// Function to show winner modal
function showWinnerModal(message) {
  winnerMessage.value = message
  winnerModalOpenState.value = true

  stopSound('bgm')
  playSound('sfx', '/sounds/winner-sound.mp3')


}



// Function to check game over conditions
function checkGameOver() {
  if (isBoardLoading.value || currentPage.value !== 'game') return
  const { white, black } = kingsExist.value
  if (!white) showWinnerModal('Black!')
  if (!black) showWinnerModal('White!')
}

// Watch for changes in king mice existence
watch(kingsExist, checkGameOver)


const handleBackToMenu = () => {

  currentPage.value = 'home'

  cards.value = []
  usedCheeses.value = {
    'white': {
      'cheddar-cheese': false,
      'gouda-cheese': false,
      'swiss-cheese': false
    },
    'black': {
      'cheddar-cheese': false,
      'gouda-cheese': false,
      'swiss-cheese': false
    }
  }

  winnerModalOpenState.value = false
}

const toggleManaulModal = () => {
  manualModalOpenState.value = !manualModalOpenState.value
}

</script>

<template>
  <!-- manual modal-->
  <div v-if="manualModalOpenState" class="fixed inset-0 z-50 bg-[#0008] backdrop-blur-sm grid place-items-center">
    <div class="bg-amber-200 w-[50rem] h-[30rem] rounded-3xl border-[1rem] border-amber-500">

      <header class="h-[6rem]">
        <div
          class="text-4xl bg-amber-500 text-white w-full h-full flex items-center justify-center font-sigmar relative">
          <div>Game Manual</div>
          <button @click="toggleManaulModal"
            class="flex justify-center bg-red-500 w-24 rounded-2xl absolute top-0 right-0"> X
          </button>
        </div>
      </header>
      <section class="h-[calc(100%-6rem)]">
        <div class="h-[2rem] flex translate-y-[2px]">
          <div @click="manualSelectedTab = 0" :class="manualSelectedTab === 0 ? 'bg-amber-300' : 'bg-amber-200'"
            class="rounded-t-lg border-2 border-b-0 px-5 py-1 font-semibold text-zinc-800 select-none cursor-pointer">
            How to play
          </div>
          <div @click="manualSelectedTab = 1" :class="manualSelectedTab === 1 ? 'bg-amber-300' : 'bg-amber-200'"
            class="rounded-t-lg border-2 border-b-0 px-5 py-1 font-semibold text-zinc-800 select-none cursor-pointer">
            Cards
          </div>
        </div>

        <article v-show="manualSelectedTab === 0"
          class="h-[calc(100%-2rem)] overflow-auto bg-amber-300 border-2 rounded-[0rem_.5rem_.5rem_.5rem] text-stone-900 p-4">
          <p class="m-4 text-2xl text-orange-600 flex flex-col items-center justify-center bg-yellow-100 border-2 border-yellow-500 rounded-lg font-bold h-12
                w-[50%]">
            Goal / How you can win </p>
          <div class="m-4">
            <div>คุณสามารถชนะได้ด้วยวิธีใดด้วยวิธีหนึ่งจากวิธีต่อไปนี้</div>
            <span class="text-red-600">[รูป]กำจัดหนูทั้งหมดบนกระดาน</span>ของหนูอาณาจักรฝั่งตรงข้าม
            <div class="text-red-600">[รูป]กำจัดราชาหนูอาณาจักรฝั่งตรงข้าม</div>
            <span class="text-red-600">[รูป] ราชาหนูอาณาจักรตรงข้ามโดนแมวกิน </span>
          </div>

          <div class="m-4">
            <span
              class="text-xl font-bold bg-yellow-100 rounded-lg w-[20%] flex items-center justify-center border-2 border-yellow-500 h-12 my-3">
              Mouse </span>
            <span>เมื่อเกมเริ่มขึ้น เกมจะมีหนู 2 ฝั่ง โดยแต่ละฝั่งจะมีหนูอยู่ฝั่งละ 3 ตัวด้วยกัน
              โดยหนูแต่ละตัวมีความแตกต่างกัน ดังนี้</span>
            <div class="flex gap-2 my-4">
              <img src="/crown.png" alt="crown" class="w-6 h-6 flex justify-center self-center" />
              <p class="font-bold text-lg m-3">
                The king mouse
              </p>
            </div>
            <div class="flex my-4 space-x-10">
              <div class="text-center">
                <img src=" /king-black.png" alt="king-black" class="w-28 rounded-lg border-orange-400 border-4">
                <b class="text-white bg-gray-900 rounded-lg p-2 border-orange-400 border-2">Black king</b>
              </div>
              <div class="text-center">
                <img src="/king-white.png" alt="king-white" class="w-28 rounded-lg border-orange-400 border-4">
                <b class="text-gray-900 bg-white rounded-lg p-2 border-orange-400 border-2">White king</b>
              </div>
            </div>
            <div class="bg-white w-full border rounded-lg p-3">
              เป็นราชาหนูหนูของอาณาจักร โดยมีหน้าที่ไม่ต่างจากทหารหนูตัวอื่น ๆ ในจักรววรดิมากนัก
              แต่ด้วยความเป็นราชาหนูที่มีภาระอันยิ่งใหญ่ ถ้าหากอยู่ในสถานะ <b class="text-red-500">'ตาย'</b> อาณาจักร
              พื้นที่ และชัยชนะจะถูกช่วงชิง
              และ อาณาจักรของคุณ<b class="text-red-500"> แพ้เกมในทันที </b>
            </div>

            <div class="flex gap-2 my-4">
              <img src="/soldier.png" alt="soldier" class="w-8 h-8 justify-center items-center self-center" />
              <p class="font-bold text-lg m-3 ">
                The soldier mouse
              </p>
            </div>
            <div class="flex my-4 space-x-10">
              <div class="text-center">
                <img src="/soldier-black.png" alt="soldier-black" class="w-28 rounded-lg border-orange-400 border-4">
                <b class="text-white bg-gray-900 rounded-lg p-2 border-orange-400 border-2">White soldier</b>
              </div>
              <div class="text-center">
                <img src="/soldier-white.png" alt="soldier-white" class="w-28 rounded-lg border-orange-400 border-4">
                <b class="text-gray-900 bg-white rounded-lg p-2 border-orange-400 border-2">Black soldier</b>
              </div>
            </div>
            <div class="bg-white w-full border rounded-lg p-3">เป็นทหารหนูของอาณาจักร
              โดยมีหน้าที่ช่วยกันปกป้องราชาหนูหนูจากอันตราย
              และสามารถ <b class="text-red-500">ฆ่าราชาหนูของอาณาจักรฝั่งตรงข้าม</b> เพื่อคว้าชัยชนะได้
            </div>
          </div>
        </article>

        <article v-show="manualSelectedTab === 1"
          class="h-[calc(100%-2rem)] overflow-auto bg-amber-300 border-2 rounded-[0rem_.5rem_.5rem_.5rem] p-4">
          <div class="grid grid-cols-[8rem_auto] grid-flow-row gap-5 text-black">
            <div
              class=" text-2xl text-orange-600 flex flex-col items-center justify-center bg-yellow-100 border-2 border-yellow-500 rounded-lg font-bold">
              Cards</div>
            <div
              class=" text-2xl text-orange-600 flex flex-col items-center justify-center bg-yellow-100 border-2 border-yellow-500 rounded-lg font-bold">
              Effect</div>
            <img src="/plate.png" alt="plate" class="border-white border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg">Plate card: การ์ดพื้นที่พัก</strong>
              <div>
                เมื่อหนูเหยียบการ์ดจานจะไม่มีผลใด ๆ และจบตาทันที
                แต่การ์ดจานที่ว่างอยู่จะสามารถเป็นจุดเรียกทหารหนูตัวใหม่มาเพิ่มจากความสามารถของการ์ดชีสได้
                <p>ลิงก์การ์ด: <span class="font-bold">[cheese card]</span></p>
                <p class="text-purple-600">การ์ดจานมีทั้งหมด 10 ใบ</p>
              </div>
            </div>

            <img src="/swiss-cheese.png" alt="swiss-cheese" class="border-green-400 border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg">Cheese card: การ์ดชีส หรือ การ์ดเรียกกำลังพล</strong>
              <div>
                การ์ดนี้จะถูกใช้เมื่อ 'ราชาหนูหนู' มีการเหยียบการ์ดชีส ราชาหนูจะเรียกทหารหนูได้
                ประเภทชีสมีทั้งหมด 3 แบบ
                <div class="grid">
                  <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                      <img src="/gouda-cheese.png" alt="gouda-cheese" class="w-28 rounded-lg">
                      <div>Gouda cheese</div>
                    </div>
                    <div class="flex flex-col items-center">
                      <img src="/cheddar-cheese.png" alt="cheddar-cheese" class="w-28 rounded-lg">
                      <div>Cheddar cheese</div>
                    </div>
                    <div class="flex flex-col items-center">
                      <img src="/swiss-cheese.png" alt="swiss-cheese" class="w-28 rounded-lg">
                      <div>Swiss cheese</div>
                    </div>
                  </div>
                  <div class="my-3">โดยมีกรณีใช้ ดังนี้
                    เมื่อราชาหนูเหยียบลงบนการ์ดชีส
                    ราชาหนูจะสามารถเรียกทหารหนูมาเพิ่มมาบนการ์ดจานที่ถูกเปิดเผยแล้วและว่างอยู่แบบสุ่มได้
                    ซึ่งชีสชนิดที่ถูกใช้แล้ว
                    จะไม่สามารถใช้งานได้อีกในเกมนั้น
                    <p>แต่ถ้าหากไม่มีการ์ดจานที่สามารถเรียกทหารหนูได้ จะจบตานั้นทันที โดยไม่นับว่าชีสชนิดนั้นถูกใช้งาน
                    </p>
                    <p class="text-purple-600">การ์ดชีสแต่ละชนิดมี 2 ใบ รวมชีสทุกชนิดมีทั้งหมดรวม 6 ใบ</p>
                  </div>
                </div>
              </div>
            </div>

            <img src="/glue-mouse-trap.png" alt="glue-mouse-trap" class="border-yellow-200 border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg"> Glue trap card: การ์ดกาวดักหนู</strong>
              <div>
                การ์ดนี้จะถูกใช้เมื่อหนูเหยียบการ์ดกาวดักหนู
                จะทำให้หนูตัวนั้นอยู่ในสถานะติดอยู่กับที่
                สถานะมีทั้งหมด 3 สถานะ
                <div class="grid">
                  <div>[รูป] ติดกาว</div>
                  <div>[รูป] พยายามออกจากกาว</div>
                  <div>[รูป] ออกจากกาวและเดินเกมต่อได้</div>
                  <p class="text-purple-600">การ์ดกาวมีทั้งหมด 4 ใบ</p>
                </div>
              </div>
            </div>

            <img src="/cat-card.png" alt="cat-card" class="border-red-500 border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg">Cat card: การ์ดแมว</strong>
              <div>
                การ์ดนี้จะถูกใช้เมื่อหนูเหยียบการ์ดแมว หนูตัวนั้นจะอยู่ในสถานะ 'ตาย' ทันที
                [รูป] ทหารหนูตาย และ ราชาหนูตาย
                <div class="text-red-600">* Warning: ถ้าราชาหนูหนูตาย อาณาจักรนั้น ๆ จะแพ้ทันที !! *</div>
                <p class="text-purple-600">การ์ดจานมีทั้งหมด 3 ใบ</p>
              </div>
            </div>

            <img src="/spring.png" alt="spring" class="border-green-400 border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg">Spring card: การ์ดสปริง</strong>
              <div>
                การ์ดนี้จะถูกใช้เมื่อหนูเหยียบการ์ดสปริง หนูตัวนั้นจะสามารถเดินได้ 2 ครั้ง
                แต่หนูตัวนั้นจะไม่สามารถกระโดดกลับไปยังสปริงที่เพิ่งเดินผ่านมาได้ (เดินไปและเดินกลับ)
                แต่ถ้าหากไม่สามารถไปที่การ์ดใด ๆ ได้ สามารถเดินกลับสปริงได้ในกรณีพิเศษ
                <div class="text-red-600">[รูปถูก] [รูปผิด]</div>
                <p class="text-purple-600">การ์ดสปริงมีทั้งหมด 7 ใบ</p>
              </div>
            </div>

            <img src="/peanut.png" alt="peanut" class="border-green-400 border-4 rounded-lg">
            <div class="bg-slate-50 rounded-lg px-4 py-3">
              <strong class="text-lg">Peanut card: การ์ดถั่ว หรือ การ์ดสั่งการ</strong>
              <div>
                การ์ดนี้จะถูกใช้เมื่อหนูเหยียบการ์ดถั่ว หนูตัวนั้นจะทำหน้าที่ <span class="font-">'สั่งการ'</span>
                เท่านั้น
                โดยตัวมันจะไม่สามารถเดินได้ในตานั้น แต่จะสามารถสั่งการให้หนูตัวอื่นในฝั่งตัวเองเดินได้ 1 ตา
                <div class="text-gray-700 italic">แต่ถ้าหาก ไม่มีทหารหนูอยู่ในบนกระดานแล้ว
                  การ์ดนี้จะถือเป็นการ์ดปกติที่ไม่มีผลใด ๆ ทันที</div>
                <p class="text-purple-600">การ์ดถั่วมีทั้งหมด 6 ใบ</p>
              </div>
            </div>

          </div>
        </article>
      </section>
    </div>
  </div>

  <!-- white stuck modal -->
  <transition>
    <div v-if="playerStuckModal.white"
      class="inset-0 fixed top-0 z-50 bg-[#00000039] grid place-items-center backdrop-blur-sm">
      <div
        class="bg-gray-600 bg-opacity-70 w-96 h-96 rounded-3xl flex flex-col items-center justify-center border-[0.5rem] border-white modal-content">
        <img src="/a-stop-sign.png" alt="stop-sign" class="rounded-lg w-28 h-28 my-3 border border-white"></img>
        <div class="grid text-center font-sigmar">
          <span class="text-3xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_6px_0px_rgba(255,255,255,0.5)]">{{
            currentPlayerFaction }}</span>
          <span class="text-xl mt-4 text-white"> is stuck! Skip turn to black</span>
        </div>
        <div class="flex flex-row items-center justify-center gap-10">
          <button @click="handleStuckModalSubmit"
            class="flex w-full justify-center rounded-md mt-6 px-8 py-1.5 bg-[#ff4f0f] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#ff6d38] hover:scale-110 transition duration-300 ease-in-out">OK</button>
        </div>
      </div>
    </div>
  </transition>

  <!-- black stuck modal -->
  <transition>
    <div v-if="playerStuckModal.black"
      class="inset-0 fixed top-0 z-50 bg-[#00000039] grid place-items-center backdrop-blur-sm">
      <div
        class="bg-gray-400 bg-opacity-90 w-96 h-96 rounded-3xl flex flex-col items-center justify-center border-[0.5rem] border-gray-800 modal-content">
        <img src="/a-stop-sign.png" alt="stop-sign" class="rounded-lg w-28 h-28 my-3 border border-white"></img>
        <div class="grid text-center font-sigmar">
          <span class="text-3xl md:text-5xl lg:text-6xl text-gray-700 drop-shadow-[0px_6px_0px_#626f84]">{{
            currentPlayerFaction }}</span>
          <span class="text-xl mt-4 text-gray-700"> is stuck! Skip turn to white</span>
        </div>
        <div class="flex flex-row items-center justify-center gap-10">
          <button @click="handleStuckModalSubmit"
            class="flex w-full justify-center rounded-md mt-6 px-8 py-1.5 bg-[#ff4f0f] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#ff6d38] hover:scale-110 transition duration-300 ease-in-out">OK</button>
        </div>
      </div>
    </div>
  </transition>

  <!-- End game modal -->
  <div v-if="winnerModalOpenState" class="inset-0 fixed top-0 z-50 bg-[#0008] grid place-items-center backdrop-blur-sm">
    <div
      class="bg-amber-200 w-96 h-72 rounded-3xl flex flex-col items-center justify-center border-[1rem] border-amber-500 modal-content">
      <div class="grid text-center drop-shadow-[0px_8px_0px_#FFEFBBFF] font-sigmar">
        <span class="text-4xl md:text-6xl lg:text-7xl text-[#FF4500] animate-bounce">{{ winnerMessage }}</span>
        <span class="text-3xl md:text-5xl lg:text-6xl text-[#FF4500] animate-bounce">Win</span>
      </div>
      <div class="flex flex-row items-center justify-center gap-10">
        <button @click="handleBackToMenu"
          class="flex w-full h-10 justify-center rounded-md mt-6 px-8 py-1.5 bg-neutral-500 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-600 hover:scale-110 transition duration-300 ease-in-out">Back
          to Menu</button>
      </div>
    </div>
  </div>

  <transition>
    <div v-if="noplateToUseCheeseModal"
      class="inset-0 fixed top-0 z-50 bg-[#00000039] grid place-items-center backdrop-blur-sm">
      <div
        class="bg-amber-200 bg-opacity-90 w-96 h-96 rounded-3xl flex flex-col items-center justify-center border-[0.5rem] border-amber-300 modal-content">
        <img src="/broken-plate.png" class="rounded-lg w-28 h-28 my-1 border border-white"></img>
        <div class="grid text-center font-sigmar">

          <span class="text-2xl mt-2 text-orange-600">No plate!</span>
          <span class="text-lg mt-2 text-amber-600">soldier mouse can't spawn without a reveal plate card</span>
          <span class="text-sm mt-3 text-neutral-500">(this cheese type can still be used)</span>
        </div>
        <div class="flex flex-row items-center justify-center gap-10">
          <button @click="noplateToUseCheeseModal = false"
            class="flex w-full justify-center rounded-md mt-6 px-8 py-1.5 bg-[#ff4f0f] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#ff6d38] hover:scale-110 transition duration-300 ease-in-out">OK</button>
        </div>
      </div>
    </div>
  </transition>

  <transition>
    <div v-if="useSameCheeseModal"
      class="inset-0 fixed top-0 z-50 bg-[#00000039] grid place-items-center backdrop-blur-sm">
      <div
        class="bg-amber-200 bg-opacity-90 w-96 h-96 rounded-3xl flex flex-col items-center justify-center border-[0.5rem] border-amber-300 modal-content">
        <img src="/no-cheese.png" class="rounded-lg w-28 h-28 my-3 border border-white"></img>
        <div class="grid text-center font-sigmar">

          <span class="text-xl mt-4 text-amber-500"> You have already used</span>
          <span class="text-xl mt-4 text-amber-500"> this type of cheese</span>
        </div>
        <div class="flex flex-row items-center justify-center gap-10">
          <button @click="useSameCheeseModal = false"
            class="flex w-full justify-center rounded-md mt-6 px-8 py-1.5 bg-[#ff4f0f] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#ff6d38] hover:scale-110 transition duration-300 ease-in-out">OK</button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Story Modal -->
  <div v-if="storyModal" class="fixed inset-0 z-50 grid place-items-center  bg-black bg-opacity-50 backdrop-blur-lg w-screen h-screen">

    <div
      class="bg-amber-100 border-[0.8rem] border-amber-500 p-5 rounded-lg w-6/12  h-3/5 md:h-4/5 grid grid-cols justify-center overflow-x-auto font-sigmar ">

      <div class="flex flex-col items-center justify-center">
        <h2 class="text-3xl font-bold text-[#65493e] animate-bounce"> Game Story</h2>
        <img src="/gameStory.png" alt="game-story"
          class="rounded-lg w-60 h-40 bg-cover border border-white my-4 mx-4" />
      </div>

      <div class="text-center mx-4 font-serif font-medium">
        <span class="text-lg text-gray-600 text-wrap font-mitr">สมบัติ เกียรติยศ และชีส
          สามสิ่งนี้เป็นสิ่งที่ประชาหนูทุกตัวแห่งอาณาจักรชีส
          ต่างปรารถนา...
          แต่น้ำนิ่งนั้นไหลลึก ภายใต้สันติสุขจอมปลอม ราชาขาว และ ราชาดำ
          ทั้งสองได้ริเริ่มสงครามขึ้น
          จะขาวหรือดำ จะชีสหรือเนย
          มีเพียงผู้ชนะเท่านั้นที่จะได้เขียนประวัติศาสตร์ มาเถอะเหล่าผู้กล้าจงควบคุมพวกเราและคว้าชีสก้อนนั้นซะ!!!
        </span>
      </div>

      <div class="flex flex-row ml-96 md:ml-[80%]">
        <button @click="storyModal = false"
          class="flex justify-end rounded-md mt-2 text-lg  text-amber-600 shadow-sm hover:text-amber-500 hover:scale-110 transition duration-300 ease-in-out">Skip
          >></button>
      </div>

    </div>
  </div>

  <div v-if="currentPage === 'home'">
    <div class="w-screen h-screen bg-[url('/bg-main-menu.png')] bg-no-repeat bg-cover bg-center">
      <div class="grid grid-rows-2 grid-flow-col gap-4 font-sigmar">
        <div class="grid text-center mt-20 md:mt-36 drop-shadow-[0px_8px_0px_#FFEFBBFF]">
          <span class="text-5xl md:text-7xl lg:text-8xl text-[#313638]">CHEESE</span>
          <span class="text-3xl md:text-4xl lg:text-5xl text-[#313638]">KINGDOM</span>
        </div>

        <!-- ปุ่ม Game -->
        <div class="flex flex-col items-center gap-3 mt-6 md:mt-8">
          <button @click="startGame"
            class="bg-white rounded-lg text-lg md:text-xl lg:text-2xl shadow-md h-12 md:h-16 w-40 md:w-48 lg:w-56 text-green-600">
            PLAY GAME
          </button>
          <button @click="manualModalOpenState = true"
            class="bg-white rounded-lg text-lg md:text-xl lg:text-2xl shadow-md h-12 md:h-16 w-40 md:w-48 lg:w-56 text-slate-500">
            HOW TO PLAY
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="currentPage === 'game'">


    <div class="-z-10 fixed w-screen h-screen bg-[#0002] backdrop-blur-sm"></div>
    <div class="-z-20 fixed bg-[url('/bg2.png')] bg-cover w-screen h-screen"></div>
    <!-- button menu -->
    <div class="fixed flex">
      <button @click="handleBackToMenu"
        class="flex items-center justify-center gap-1 px-4 py-2 my-2 mx-4 rounded-lg hover:backdrop-contrast-75 bg-transparent border border-white text-white cursor-pointer select-none transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" viewBox="0 0 16 16">
          <path
            d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z" />
          <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z" />
        </svg>
        <div class="font-medium">HOME</div>
      </button>
    </div>
    <div class="flex items-center fixed top-0 right-0">
      <div @click="toggleBgm" class="m-2 cursor-pointer group">
        <svg v-show="isBgmPlaying" class="group-hover:fill-slate-500" xmlns=" http://www.w3.org/2000/svg" width="35"
          height="35" fill="white" viewBox="0 0 16 16">
          <path
            d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2" />
          <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z" />
          <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z" />
        </svg>
        <svg v-show="!isBgmPlaying" class="group-hover:fill-slate-500" width="35" height="35" viewBox="0 0 35 35"
          fill="#f44" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.125 28.4375C13.125 30.8547 10.675 32.8125 7.65626 32.8125C7.21095 32.8125 6.77803 32.7699 6.36351 32.6895C6.7751 32.4975 7.16075 32.2317 7.50049 31.892L10.9549 28.4375L12.6819 26.7105L13.125 26.2674V28.4375Z"
            fill="white" />
          <path
            d="M6.08627 30.4777C5.30522 31.2588 4.03889 31.2588 3.25784 30.4777C2.4768 29.6967 2.4768 28.4304 3.25784 27.6493L6.79006 24.1171L10.9375 19.9696L13.125 17.7821L23.4038 7.50337L28.2649 2.64226L29.4208 1.48636C30.2018 0.705312 31.4682 0.705312 32.2492 1.48636C32.8638 2.10091 32.9948 3.01589 32.6422 3.75853C32.5467 3.95973 32.4157 4.14829 32.2492 4.31479L32.189 4.375L30.625 5.939L29.6892 6.87483L13.125 23.439L11.3511 25.2129L10.9375 25.6265L6.08627 30.4777Z"
            fill-rule="evenodd" />
          <path
            d="M32.8125 24.0625C32.8125 26.4797 30.3625 28.4375 27.3438 28.4375C24.325 28.4375 21.875 26.4797 21.875 24.0625C21.875 21.6453 24.325 19.6875 27.3438 19.6875C28.5746 19.6875 29.7108 20.013 30.625 20.5623V8.76742L32.8125 6.57993V24.0625Z"
            fill="white" />
          <path
            d="M10.9375 6.35468C10.9375 5.81239 11.1389 5.28943 11.5027 4.88725C11.8665 4.48507 12.3667 4.23235 12.9063 4.17812L25.1222 2.95653L20.2611 7.81764L13.125 8.53125V14.9537L10.9375 17.1412V8.75V6.5625V6.35468Z"
            fill="white" />
        </svg>
      </div>
      <div @click="manualModalOpenState = true" class="m-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="35" fill="white"
          class="bi bi-info-circle-fill hover:fill-gray-500  " viewBox="0 0 16 16">
          <path
            d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
        </svg>
      </div>
    </div>
    <div class="flex justify-center items-end h-20 text-4xl w-screen text-slate-50 font-sigmar">Cheese
      Kingdom</div>
    <div class="text-center text-2xl font-bold text-white mb-1">
      <!--แสดง turn-->
      Current Player: {{ currentPlayerFaction }}
    </div>

    <div class="h-[calc(100vh-6rem)] grid place-items-center grid-cols-4">
      <!-- UI mouse display right -->
      <div class="col-start-1">
        <div
          class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white"
          :class="currentPlayerFaction === 'white' ? 'animate-glowing' : 'normal'">
          <img src="/grey_mouse.png" alt="greyMouse" class="rounded-lg w-56 h-56 my-3 border border-white"></img>

          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div class="flex flex-col space-y-4">
              <div class="flex justify-center items-center gap-2 font-bold text-white text-3xl">
                <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
                <span class="text-outline">x {{ totalWhiteMouses }}</span>
              </div>
              <div class="flex justify-center gap-2">
                <img src="/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.white['swiss-cheese'] }">
                <img src="/cheddar-cheese.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.white['cheddar-cheese'] }">
                <img src="/gouda-cheese.png" alt="goudar_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.white['gouda-cheese'] }">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 grid-rows-6 w-fit col-start-2 col-span-2 gap-2 bg-[#E0DFD5] bg-opacity-30">
        <div v-for="(row, idx) in cards" :key="idx" class="grid grid-cols-6 grid-rows-1 gap-2">
          <div v-for="(card) in row" :key="card.id" @click="handleSelectCard(card)"
            class="ck-card w-[95px] h-[95px] flex items-center justify-center rounded-lg border-2 border-white bg-cover hover:border-green-500"
            :class="[
              !card.isReveal ? 'bg-gray-800' : '',
              card.isReveal && card.type === 'plate' ? 'bg-[url(/plate.png)]' : '',
              card.isReveal && card.type === 'spring' ? 'bg-[url(/spring.png)]' : '',
              card.isReveal && card.type === 'peanut' ? 'bg-[url(/peanut.png)]' : '',
              card.isReveal && card.type === 'cheddar-cheese' ? 'bg-[url(/cheddar-cheese.png)]' : '',
              card.isReveal && card.type === 'gouda-cheese' ? 'bg-[url(/gouda-cheese.png)]' : '',
              card.isReveal && card.type === 'swiss-cheese' ? 'bg-[url(/swiss-cheese.png)]' : '',
              card.isReveal && card.type === 'glue' ? 'bg-[url(/glue-mouse-trap.png)]' : '',
              card.isReveal && card.type === 'cat' ? 'bg-[url(/cat-card.png)]' : '',
             
              selectedMouse?.availableMoves.includes(card.id) && selectedMouse.validateMove(card) ? 'highlight-card' : ''
            ]">

            <div :class="{
              'opacity-0': !card.mouse,
              'opacity-100': card.mouse,
              'bg-[url(/king-black.png)]': card.mouse?.faction === 'black' && card.mouse?.type === 'king',
              'bg-[url(/king-white.png)]': card.mouse?.faction === 'white' && card.mouse?.type === 'king',
              'bg-[url(/soldier-black.png)]': card.mouse?.faction === 'black' && card.mouse?.type === 'soldier',
              'bg-[url(/soldier-white.png)]': card.mouse?.faction === 'white' && card.mouse?.type === 'soldier',
              'ck-stucked': card.mouse?.isStucked,
              'border-red-500 border-4 box-content opacity-60': card.mouse?.isDisabled,
              'border-green-500 border-4 box-content': card.mouse === selectedMouse,
              'scale-110': card.mouse === selectedMouse,
              'scale-90 opacity-50': selectedMouse && card.mouse?.faction === selectedMouse?.faction && card.mouse !== selectedMouse,
            }" class="ck-mouse w-12 h-12 rounded-full bg-cover border-2 border-black visited:border-green-500">
            </div>
          </div>
        </div>
      </div>
      <!-- UI mouse display left -->
      <div class="col-start-4">
        <div 
          class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white"
          :class="currentPlayerFaction === 'black' ? 'animate-glowing' : 'normal'">
          <img src="/grey_kem_mouse.png" class="rounded-lg w-56 h-56 my-3 border border-white" alt="greyKemMouse"></img>
          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div class="flex flex-col space-y-4">
              <div class="flex justify-center items-center gap-2 font-bold text-white text-3xl">
                <img src="/grey_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
                <span class="text-outline">x {{ totalBlackMouses }}</span>
              </div>
              <div class="flex justify-center gap-2">
                <img src="/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.black['swiss-cheese'] }">
                <img src="/cheddar-cheese.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.black['cheddar-cheese'] }">
                <img src="/gouda-cheese.png" alt="gousar_cheese" class="w-16 h-16 rounded-xl" :class="{ 'saturate-0': usedCheeses.black['gouda-cheese'] }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ck-mouse {
  transition: transform 300ms ease, border 100ms ease;
}

.ck-mouse.ck-stucked {
  transform: rotate(180deg);
  box-sizing: content-box;
  border: 8px solid #ceb723;
}

.mouse-enter-from {
  transform: rotate(0deg);
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.highlight-card:after {
  content: '';
  position: absolute;
  width: 4rem;
  height: 4rem;
  background-image: url(/move-marker.png);
  background-position: center;
  animation: zoom 1s infinite;
}

@keyframes zoom {
  0%, 100% {
    transform: scale(.9);
  }
  50% {
    transform: scale(1);
  }
}

.animate-glowing {
  transition: box-shadow 0.5s ease, transform 0.5s ease;
  transform: scale(1.1);
  opacity: 1;
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 35px 5px rgba(255, 255, 255, 0.25);
  } to {
    box-shadow: 0 0 35px 10px rgba(255, 255, 255, 0.75);
  }
}

.normal {
  transition: box-shadow 0.5s ease, transform 0.5s ease;
  transform: scale(1);
  opacity: 0.90;
  filter: saturate(0.5);
}
</style>
