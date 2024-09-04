<script setup>

import { ref, computed, onMounted, watch } from 'vue'

import Mouse from './classes/Mouse.js'
import Card from './classes/Card.js'

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
const manaulModalOpenState = ref(false)
const noplateToUseCheeseModal = ref(false)
const useSameCheeseModal = ref(false)
const storyModal = ref(false)
const winnerMessage = ref('') // New ref for winner message
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
  cards.value.flat()[0].type = 'spring'
  cards.value.flat()[7].type = 'spring'
  isBoardLoading.value = false
}

/**
 * Total white mouses
 */
const totalWhiteMouses = computed(() => {
  return cards.value.flat().filter((c) => c.mouse?.faction === 'white').length
})

/**
 * Total black mouses
 */
const totalBlackMouses = computed(() => {
  return cards.value.flat().filter((c) => c.mouse?.faction === 'black').length
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

/**
 * This function is called when a card is clicked.
 * @param {Card} selectedCard - The card that was clicked
 */
const handleSelectCard = async (selectedCard) => {

  // If selected card has a mouse and it belongs to the current player, select it.
  if (selectedCard.mouse !== null && selectedCard.mouse.faction === currentPlayerFaction.value) {
    selectedMouse.value = selectedCard.mouse
  } else if (selectedMouse.value !== null) { // If a mouse is selected, move it to the selected card.
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


const handleWinnerModalBackToMenu = () => {

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
  manaulModalOpenState.value = !manaulModalOpenState.value
}


</script>

<template>
  <!-- manaul modal-->
  <div v-if="manaulModalOpenState" class="grid place-items-center inset-0 fixed top-0 z-50 bg-[#0008] backdrop-blur-sm">
    <div class="bg-amber-200 w-[40rem] h-[30rem] rounded-3xl  border-[1rem] border-amber-500 modal-content relative">

      <!-- ปุ่มปิด ('X') -->
      <button @click="manaulModalOpenState = false"
        class="absolute top-4 right-4 text-white text-xl font-bold bg-red-500 w-10 h-10 rounded-full ">
        X
      </button>
      <div class="m-10 ">

        <div role="tablist" class="tabs tabs-lifted">
          <input type="radio" name="my_tabs_2" role="tab"
            class="tab [--tab-bg:#da9f1f] [--tab-border-color:black] whitespace-nowrap" aria-label="How to play"
            checked />
          <div role="tabpanel" class="tab-content bg-[#da9f1f] border-[black] rounded-box p-6 h-80 overflow-scroll">
            Tab content 1
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Libero quia cumque eos quidem quas adipisci
            excepturi ratione sequi inventore voluptatibus, ea similique earum assumenda illum maiores, necessitatibus
            tempora, labore dolore corporis qui laudantium. Rerum natus sunt voluptatibus dignissimos ipsa tempore
            necessitatibus, sapiente aspernatur eum ipsum voluptate id odit quis quaerat expedita quo ea. Quis nesciunt,
            sed asperiores doloremque voluptatem impedit obcaecati! A delectus, facere officia recusandae magni eaque ut
            obcaecati aliquid deserunt iusto voluptates possimus cumque atque perferendis omnis. Adipisci alias fugit
            cupiditate sapiente natus animi? Sunt error quidem ullam tenetur alias soluta. Nobis cupiditate dolorem quas
            impedit? Rerum, sequi.
          </div>

          <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Cards" />
          <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6 h-80 overflow-scroll">
            Tab content 2
          </div>
        </div>
      </div>
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
        <button @click="handleWinnerModalBackToMenu"
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
        <img src="/broken-plate.png" alt="stop-sign" class="rounded-lg w-28 h-28 my-1 border border-white"></img>
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
        <img src="/no-cheese.png" alt="stop-sign" class="rounded-lg w-28 h-28 my-3 border border-white"></img>
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
    <div class="w-screen h-screen bg-[url('/bg-main-menu.png')] bg-no-repeat bg-cover">
      <div class="grid grid-rows-2 grid-flow-col gap-4 font-sigmar">
        <div class="grid text-center mt-20 md:mt-36 drop-shadow-[0px_8px_0px_#FFEFBBFF]">
          <span class="text-5xl md:text-7xl lg:text-8xl text-[#313638]">CHEESE</span>
          <span class="text-3xl md:text-4xl lg:text-5xl text-[#313638]">KINGDOM</span>
        </div>

        <!-- ปุ่ม Game -->
        <div class="flex flex-col items-center gap-3 mt-6 md:mt-8 ">
          <button @click="startGame"
            class="bg-white rounded-lg text-lg md:text-xl lg:text-2xl shadow-md h-12 md:h-16 w-40 md:w-48 lg:w-56 text-green-600">
            PLAY GAME
          </button>
          <button @click="manaulModalOpenState = true"
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
    <div class="flex items-center fixed top-0 right-0">
      <div class="m-2 cursor-pointer">
        <svg xmlns=" http://www.w3.org/2000/svg" width="35" height="35" fill="white" class="bi bi-music-note-fill"
          viewBox="0 0 16 16">
          <path
            d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2" />
          <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z" />
          <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z" />
        </svg>
      </div>
      <div @click="manaulModalOpenState = true" class="m-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="white"
          class="bi bi-info-circle-fill hover:fill-gray-500  " viewBox="0 0 16 16">
          <path
            d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
        </svg>
      </div>
      <div class="m-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="white" class="bi bi-gear-fill"
          viewBox="0 0 16 16">
          <path
            d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
        </svg>
      </div>
    </div>
    <div class="flex justify-center items-end h-24 text-5xl w-screen text-slate-50 font-sigmar">Cheese Kingdom</div>
    <div class="text-center text-2xl font-bold text-white mb-4">
      <!--แสดง turn-->
      Current Player: {{ currentPlayerFaction }}
    </div>
    <div class="h-[calc(100vh-6rem)] grid place-items-center grid-cols-4">
      <!-- UI mouse display rigth -->
      <div class="col-start-1">
        <div class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white">
          <img src="/grey_mouse.png" alt="greyMouse" class="rounded-lg w-56 h-56 my-3 border border-white"></img>
          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div class="flex flex-col space-y-4">
              <div class="flex justify-center items-center gap-2 font-bold text-white text-3xl">
                <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
                <span class="text-outline">x {{ totalWhiteMouses }}</span>
              </div>
              <div class="flex justify-center gap-2">
                <img src="/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl">
                <img src="/cheddar.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl">
                <img src="/gouda-cheese.png" alt="goudar_cheese" class="w-16 h-16 rounded-xl">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 grid-rows-6 w-fit col-start-2 col-span-2 gap-2 bg-[#E0DFD5] bg-opacity-30">
        <div v-for="(row, idx) in cards" :key="idx" class="grid grid-cols-6 grid-rows-1 gap-2">
          <div v-for="(card) in row" :key="card.id" @click="handleSelectCard(card)"
            class="ck-card w-[95px] h-[95px] flex items-center justify-center border-2 border-white bg-cover hover:border-green-500"
            :class="[
              !card.isReveal ? 'bg-gray-800' : '',
              card.isReveal && card.type === 'plate' ? 'bg-[url(/plate.png)]' : '',
              card.isReveal && card.type === 'spring' ? 'bg-[url(/grey-coil-spring.png)]' : '',
              card.isReveal && card.type === 'peanut' ? 'bg-[url(/ground-nut.png)]' : '',
              card.isReveal && card.type === 'cheddar-cheese' ? 'bg-[url(/cheddar.png)]' : '',
              card.isReveal && card.type === 'gouda-cheese' ? 'bg-[url(/gouda-cheese.png)]' : '',
              card.isReveal && card.type === 'swiss-cheese' ? 'bg-[url(/swiss-cheese.png)]' : '',
              card.isReveal && card.type === 'glue' ? 'bg-[url(/glue-mouse-trap.png)]' : '',
              card.isReveal && card.type === 'cat' ? 'bg-[url(/angry-cat-hunt-mouse.png)]' : ''
            ]">
            <div v-if="card.mouse" :class="{
              'bg-[url(/king-black.png)]': card.mouse.faction === 'black' && card.mouse.type === 'king',
              'bg-[url(/king-white.png)]': card.mouse.faction === 'white' && card.mouse.type === 'king',
              'bg-[url(/soldier-black.png)]': card.mouse.faction === 'black' && card.mouse.type === 'soldier',
              'bg-[url(/soldier-white.png)]': card.mouse.faction === 'white' && card.mouse.type === 'soldier',
              'opacity-60': card.mouse.isStuck,
              'border-red-500': card.mouse.isDisabled
            }" class="ck-mouse w-12 h-12 rounded-full bg-cover border-2 border-black visited:border-green-500">
            </div>
          </div>
        </div>
      </div>
      <!-- UI mouse display left-->
      <div class="col-start-4">
        <div class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white">
          <img src="/grey_kem_mouse.png" class="rounded-lg w-56 h-56 my-3 border border-white" alt="greyKemMouse"></img>
          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div class="flex flex-col space-y-4">
              <div class="flex justify-center items-center gap-2 font-bold text-white text-3xl">
                <img src="/grey_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
                <span class="text-outline">x {{ totalBlackMouses }}</span>
              </div>
              <div class="flex justify-center gap-2">
                <img src="/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl">
                <img src="/cheddar.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl">
                <img src="/gouda-cheese.png" alt="gousar_cheese" class="w-16 h-16 rounded-xl">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
