<script setup>
import { ref } from 'vue'

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
        type: shuffledTypes.pop(), // นำ type จาก array shuffledTypes มาใช้
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

console.dir(cards.value)

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
      fromerCard.pawn = null // เคลื่อนย้ายหมากออกจากช่องเดิม
    } else {
      targetCard.isReveal = true
      setTimeout(() => {
        targetCard.pawn = fromerCard.pawn
        fromerCard.pawn = null // เคลื่อนย้ายหมากออกจากช่องเดิม
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
</script>

<template>
  <div class="-z-10 fixed w-screen h-screen bg-[#0002] backdrop-blur-sm"></div>
  <div class="-z-20 fixed bg-[url('/bg2.png')] bg-cover w-screen h-screen"></div>
  <div class="flex flex-col h-16 text-5xl text-center w-screen text-slate-50 justify-end font-sigmar">Cheese Kingdom
  </div>
  <div class="h-[calc(100vh-4rem)] grid place-items-center grid-cols-4">
    <!-- UI mouse -->
    <div class="col-start-1">
      <div class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white">
        <img src="/grey_mouse.png" alt="greyMouse" class="rounded-lg w-56 h-56 my-3"></img>
        <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
          <div>
            <div class="flex justify-center my-3 gap-2">
              <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
              <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
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
      <img src="/grey_kem_mouse.png" class="rounded-lg w-56 h-56 my-3" alt="greyKemMouse"></img>
      <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
        <div>
          <div class="flex justify-center my-3 gap-2">
            <img src="/grey_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
            <img src="/grey_mouse(2).png" alt="grey_mouse2" class="w-16 h-16 rounded-xl">
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
</template>

<style scoped></style>
