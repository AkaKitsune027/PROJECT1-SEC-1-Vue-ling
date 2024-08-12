<script setup>
import { ref } from 'vue'

const currentPage = ref('mainGame')
const typesArray = [
  ...Array(10).fill('plate'),
  ...Array(7).fill('spring'),
  ...Array(6).fill('bean'),
  ...Array(6).fill('cheese'),
  ...Array(4).fill('mouse trap glue'),
  ...Array(3).fill('cat')
]

const shuffledTypes = typesArray.sort(() => Math.random() - 0.5)

function generateCards() {
  const result = []
  for (let r = 0; r < 6; r++) {
    const row = []
    for (let c = 0; c < 6; c++) {
      row.push({
        id: r * 6 + c + 1,
        type: shuffledTypes.pop(),
        isReveal: false,
        pawn:
          r === 0 && c === 0
            ? 'ratking'
            : r === 0 && c === 1
              ? 'white'
              : r === 1 && c === 0
                ? 'white'
                : r === 5 && c === 5
                  ? 'mouseking'
                  : r === 5 && c === 4
                    ? 'black'
                    : r === 4 && c === 5
                      ? 'black'
                      : null
      })
    }
    result.push(row)
  }
  return result
}

const cards = ref(generateCards())
const selectedPawn = ref(null)

const selectCell = (rowIndex, cellIndex) => {
  if (selectedPawn.value === null) {
    if (cards.value[rowIndex][cellIndex].pawn !== null) {
      selectedPawn.value = { row: rowIndex, col: cellIndex }
    }
  } else {
    movePawn(rowIndex, cellIndex)
    selectedPawn.value = null
  }
}

const movePawn = (rowIndex, cellIndex) => {
  const { row, col } = selectedPawn.value
  if (isValidMove(row, col, rowIndex, cellIndex)) {
    const targetCard = cards.value[rowIndex][cellIndex]
    const fromCard = cards.value[row][col]

    if (targetCard.isReveal) {
      // Trigger the CSS transition
      targetCard.pawn = fromCard.pawn
      fromCard.pawn = null
    } else {
      targetCard.isReveal = true
      setTimeout(() => {
        targetCard.pawn = fromCard.pawn
        fromCard.pawn = null
      }, 150)
    }
  }
}

const isValidMove = (rowFrom, colFrom, rowTo, colTo) => {
  const rowDiff = Math.abs(rowFrom - rowTo)
  const colDiff = Math.abs(colFrom - colTo)

  const isValidDirection = rowDiff <= 1 && colDiff <= 1
  const targetCard = cards.value[rowTo][colTo]
  const fromCard = cards.value[rowFrom][colFrom]

  if (targetCard.pawn && targetCard.pawn === fromCard.pawn) return false

  return isValidDirection
}

const startGame = () => {
  currentPage.value = 'game'
}
</script>
  // Get the target and source cards
  const targetCard = cards.value[rowTo][colTo]
  const fromCard = cards.value[rowFrom][colFrom]

  // Check if the move would capture the target card (same pawn)
  const wouldCapture = targetCard.pawn && targetCard.pawn === fromCard.pawn

  // Return whether the move is valid
  return isValidDirection && !wouldCapture


<template>

  <!-- หน้า Main Game -->
  <div v-if="currentPage === 'mainGame'"
    class="mainGame w-screen h-screen bg-[url('/public/bg-main-menu.png')] bg-no-repeat bg-cover">
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
        <button
          class="bg-white rounded-lg text-lg md:text-xl lg:text-2xl shadow-md h-12 md:h-16 w-40 md:w-48 lg:w-56 text-slate-500">
          HOW TO PLAY
        </button>
      </div>
    </div>
  </div>

  <!-- หน้า Game -->
  <!-- <div v-else-if="currentPage === 'game'" class="w-screen h-screen bg-[url('/public/kitchen-kingdom.png')] bg-no-repeat bg-cover"> -->
    <div class="h-screen grid place-items-center">
    <div class="grid grid-cols-1 grid-rows-6 w-fit">
      <div v-for="(row, rowIndex) in cards" :key="rowIndex" class="grid grid-cols-6 grid-rows-1">
        <div v-for="(cell, cellIndex) in row" :key="cell.id"
          class="w-[75px] h-[75px] flex items-center justify-center border border-white" :class="[
            !cell.isReveal ? 'bg-gray-600' : '',
            cell.isReveal && cell.type === 'plate' ? 'bg-orange-500' : '',
            cell.isReveal && cell.type === 'spring' ? 'bg-blue-500' : '',
            cell.isReveal && cell.type === 'bean' ? 'bg-red-500' : '',
            cell.isReveal && cell.type === 'cheese' ? 'bg-yellow-300' : '',
            cell.isReveal && cell.type === 'mouse trap glue' ? 'bg-pink-300' : '',
            cell.isReveal && cell.type === 'cat' ? 'bg-purple-500' : ''
          ]" @click="selectCell(rowIndex, cellIndex)">
          <div v-if="cell.pawn !== null" :class="[
            'w-10 h-10 rounded-full transition-transform duration-700 ease-in-out',
            cell.pawn === 'ratking' ? 'bg-teal-500' : '',
            cell.pawn === 'mouseking' ? 'bg-orange-600' : '',
            cell.pawn === 'black' ? 'bg-black' : '',
            cell.pawn === 'white' ? 'bg-white' : ''
          ] "></div>
        </div>
      </div>
    </div>
  </div>
  <!-- </div> -->
</template>

<style scoped>
.mainGame {
  background-size: 100% 100%;
}
</style>
