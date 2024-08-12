<script setup>
import { ref } from 'vue'

const currentPage = ref('mainGame') // สถานะเริ่มต้นเป็นหน้า mainGame

const typesArray = [
  ...Array(10).fill('plate'),
  ...Array(7).fill('spring'),
  ...Array(6).fill('bean'),
  ...Array(6).fill('cheese'),
  ...Array(4).fill('mouse trap glue'),
  ...Array(3).fill('cat')
]

// สุ่มตำแหน่งของ elements ใน array
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
            ? 'white'
            : r === 0 && c === 1
              ? 'white'
              : r === 1 && c === 0
                ? 'white'
                : r === 5 && c === 5
                  ? 'black'
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
    const fromerCard = cards.value[row][col]

    if (targetCard.isReveal) {
      targetCard.pawn = fromerCard.pawn
      fromerCard.pawn = null
    } else {
      targetCard.isReveal = true
      setTimeout(() => {
        targetCard.pawn = fromerCard.pawn
        fromerCard.pawn = null
      }, 150)
    }
  }
}

const isValidMove = (rowFrom, colFrom, rowTo, colTo) => {
  const rowDiff = Math.abs(rowFrom - rowTo)
  const colDiff = Math.abs(colFrom - colTo)

  // ตรวจสอบการเดินทิศทางตรงหรือทแยงภายใน 1 ช่อง
  const isValidDirection = (rowDiff <= 1 && colDiff <= 1)

  // ตรวจสอบว่าเป้าหมายมีหมากสีเดียวกันหรือไม่
  const targetCard = cards.value[rowTo][colTo]
  const fromCard = cards.value[rowFrom][colFrom]

  // หมากสีเดียวกันห้ามเดินซ้อนกัน
  if (targetCard.pawn && targetCard.pawn === fromCard.pawn) return false

  // ตรวจสอบว่าทิศทางการเดินถูกต้องหรือไม่
  return isValidDirection
}

const startGame = () => {
  currentPage.value = 'game' // เมื่อกดปุ่ม play game จะเปลี่ยนไปที่หน้า game
}
</script>

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
  <div v-else-if="currentPage === 'game'">
    <div class="w-screen h-screen bg-[url('/public/bg.png')] bg-no-repeat bg-cover">
      <div class="text-4xl absolute text-center w-screen top-16 text-slate-50">Cheese Kingdom</div>
      <div class="h-screen grid place-items-center grid-cols-4">
        <!-- UI mouse -->
        <div class="col-start-1">
          <img src="/public//gray_mouse.png" alt="greyMouse" class="rounded-lg w-56 h-56 my-3">
          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div>
              <div class="flex justify-center my-3 gap-2">
                <img src="/public/gray_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
                <img src="/public/gray_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
              </div>
              <div class="flex justify-center gap-2">
                <img src="/public/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl">
                <img src="/public/cheddar.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl">
                <img src="/public/gouda-cheese.png" alt="gousar_cheese" class="w-16 h-16 rounded-xl">
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 grid-rows-6 w-fit col-start-2 col-span-2 gap-2 bg-[#E0DFD5] bg-opacity-30">
          <div v-for="(row, rowIndex) in cards" :key="rowIndex" class="grid grid-cols-6 grid-rows-1 gap-2">
            <div v-for="(cell, cellIndex) in row" :key="cell.id"
              class="w-[95px] h-[95px] flex items-center justify-center border-2 border-white" :class="[
                !cell.isReveal ? 'bg-gray-800' : '',
                cell.isReveal && cell.type === 'plate' ? 'bg-yellow-500' : '',
                cell.isReveal && cell.type === 'spring' ? 'bg-blue-500' : '',
                cell.isReveal && cell.type === 'bean' ? 'bg-red-500' : '',
                cell.isReveal && cell.type === 'cheese' ? 'bg-yellow-300' : '',
                cell.isReveal && cell.type === 'mouse trap glue' ? 'bg-gray-600' : '',
                cell.isReveal && cell.type === 'cat' ? 'bg-purple-500' : ''
              ]" @click="selectCell(rowIndex, cellIndex)">
              <div v-if="cell.pawn !== null" :class="[
                'w-10 h-10 rounded-full',
                cell.pawn === 'ratking' ? 'bg-teal-500' : '',
                cell.pawn === 'mouseking' ? 'bg-orange-500' : '',
                cell.pawn === 'black' ? 'bg-black' : '',
                cell.pawn === 'white' ? 'bg-white' : ''

              ]"></div>
            </div>

          </div>
        </div>
        <!-- UI mouse -->
        <div class="col-start-4">
          <img src="/public/gray_kem_mouse.png" class="rounded-lg w-56 h-56 my-3" alt="greyKemMouse">
          <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
            <div>
              <div class="flex justify-center my-3 gap-2">
                <img src="/public/gray_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
                <img src="/public/gray_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
              </div>
              <div class="flex justify-center gap-2">
                <img src="/public/swiss-cheese.png" alt="swiss_cheese" class="w-16 h-16 rounded-xl">
                <img src="/public/cheddar.png" alt="cheddar_cheese" class="w-16 h-16 rounded-xl">
                <img src="/public/gouda-cheese.png" alt="gousar_cheese" class="w-16 h-16 rounded-xl">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>



</template>

<style scoped>
.mainGame {
  background-size: 100% 100%;
}
</style>