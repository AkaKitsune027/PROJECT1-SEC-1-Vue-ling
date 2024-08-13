card cat
<script setup>
import { ref } from 'vue'

const typesArray = [
  ...Array(10).fill('plate'),
  ...Array(7).fill('spring'),
  ...Array(6).fill('bean'),
  ...Array(2).fill('cheddar-cheese'),
  ...Array(2).fill('gouda-cheese'),
  ...Array(2).fill('swiss-cheese'),
  ...Array(4).fill('mouse-trap-glue'),
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
            ? 'white-king'
            : r === 0 && c === 1
              ? 'white'
              : r === 1 && c === 0
                ? 'white'
                : r === 5 && c === 5
                  ? 'black-king'
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
const currentPlayer = ref('white')

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
    // ถ้าช่องเป้าหมายเปิดเผยแล้ว
    if (targetCard.isReveal) {
      // ถ้าช่องเป้าหมายเป็นแมว
      if (targetCard.type === 'cat') {
        fromCard.pawn = null; // ทำให้หมากหายไป
      } else {
        targetCard.pawn = fromCard.pawn;
        fromCard.pawn = null; // เคลื่อนย้ายหมาก
      }
    } else {
      // ถ้าช่องเป้าหมายยังไม่เปิดเผย
      targetCard.isReveal = true;
      setTimeout(() => {
        if (targetCard.type === 'cat') {
          fromCard.pawn = null; // ทำให้หมากหายไป
        } else {
          targetCard.pawn = fromCard.pawn;
          fromCard.pawn = null; // เคลื่อนย้ายหมาก
        }
      }, 325);
    }
    switchTurn()
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

  // การ์ดแมว เหมียวๆ

}

const switchTurn = () => {
  currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  console.log(`It's now ${currentPlayer.value}'s turn.`)
}

// function switchTurn() {
//   // Toggle between 'white' and 'black'
//   currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
//   console.log(`It's now ${currentPlayer.value}'s turn.`)
// }

// function switchTurn() {
//   const currentPlayer = ref(1)
//   if (cards.type == 'cat' || 'plate' || 'mouse-trap-glue') {
//     currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
//     console.log('end')

//   //   setTimeout(() => {
//   //     console.log(`Player number ${currentPlayer.value}'s turn.`)
//   //   }, 2000);
//   } else if (cards.type == 'spring' || 'bean') {
//     console.log('choose another move')
//     handleCardClick()
//   } else if (cards.type == 'cheddar-cheese', 'gouda-cheese', 'swiss-cheese') {
//     chessePower()
//     // if (items.hasMouse == 'true') {
//     //   console.log('wait for the king.')

//     // }
//   }
// }
</script>

<template>
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
    <div class="m-2 cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="white" class="bi bi-info-circle-fill"
        viewBox="0 0 16 16">
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
  Current Player: {{ currentPlayer }}</div><!--แสดง turn-->
  <div class="h-[calc(100vh-6rem)] grid place-items-center grid-cols-4">
    <!-- UI mouse display rigth -->
    <div class="col-start-1">
      <div class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white">
        <img src="/grey_mouse.png" alt="greyMouse" class="rounded-lg w-56 h-56 my-3 border border-white"></img>
        <div class="flex bg-[#313638] w-60 h-48 rounded-xl items-center justify-center">
          <div>
            <div class="flex justify-center my-3 gap-2">
              <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
              <img src="/grey_mouse(1).png" alt="grey_mouse1" class="w-16 h-16 rounded-xl">
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
      <div v-for="(row, rowIndex) in cards" :key="rowIndex" class="grid grid-cols-6 grid-rows-1 gap-2">
        <div v-for="(cell, cellIndex) in row" :key="cell.id"
          class="w-[95px] h-[95px] flex items-center justify-center border-2 border-white bg-cover hover:border-green-500" :class="[
            !cell.isReveal ? 'bg-gray-800' : '',
            cell.isReveal && cell.type === 'plate' ? 'bg-[url(/plate.png)]' : '',
            cell.isReveal && cell.type === 'spring' ? 'bg-[url(/grey-coil-spring.png)]' : '',
            cell.isReveal && cell.type === 'bean' ? 'bg-[url(/ground-nut.png)]' : '',
            cell.isReveal && cell.type === 'cheddar-cheese' ? 'bg-[url(/cheddar.png)]' : '',
            cell.isReveal && cell.type === 'gouda-cheese' ? 'bg-[url(/gouda-cheese.png)]' : '',
            cell.isReveal && cell.type === 'swiss-cheese' ? 'bg-[url(/swiss-cheese.png)]' : '',
            cell.isReveal && cell.type === 'mouse-trap-glue' ? 'bg-[url(/glue-mouse-trap.png)]' : '',
            cell.isReveal && cell.type === 'cat' ? 'bg-[url(/angry-cat-hunt-mouse.png)]' : ''
          ]" @click="selectCell(rowIndex, cellIndex)">
          <div v-if="cell.pawn !== null" :class="[
            'w-12 h-12 rounded-full bg-cover border-2 border-black visited:border-green-500',
            cell.pawn === 'black-king' ? 'bg-[url(/king_dark-gray.png)]' : '',
            cell.pawn === 'white-king' ? 'bg-[url(/king_light-gray.png)]' : '',
            cell.pawn === 'black' ? 'bg-[url(/soldier_dark-gray.png)]' : '',
            cell.pawn === 'white' ? 'bg-[url(/soldier_ligth-gray.png)]' : ''
          ]"></div>
        </div>

      </div>
    </div>
    <!-- UI mouse display left-->
    <div class="col-start-4">
      <div class="bg-slate-600 bg-opacity-70 px-4 py-4 flex flex-col items-center rounded-md border-2 border-white">
        <img src="/grey_kem_mouse.png" class="rounded-lg w-56 h-56 my-3 border border-white" alt="greyKemMouse"></img>
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
  </div>
</template>

<style scoped></style>