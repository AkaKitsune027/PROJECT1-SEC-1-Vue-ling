<script setup>
import { ref } from 'vue'

const board = ref([
  ['red', 'red', null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, 'black']
])

const selectedPawn = ref(null)

const selectCell = (rowIndex, cellIndex) => {
  if (selectedPawn.value === null) {
    if (board.value[rowIndex][cellIndex] !== null) {
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
    board.value[rowIndex][cellIndex] = board.value[row][col]
    board.value[row][col] = null
  }
}

const isValidMove = (rowFrom, colFrom, rowTo, colTo) => {
  const rowDiff = Math.abs(rowFrom - rowTo)
  const colDiff = Math.abs(colFrom - colTo)

  // การเคลื่อนที่ที่ถูกต้องควรเป็นการเคลื่อนที่ในทิศทางแนวทแยงมุม (1 ช่องหรือ 2 ช่อง)
  // หรือการเคลื่อนที่ในทิศทางแนวตั้งและแนวนอน (1 ช่องหรือ 2 ช่อง)
  const isDiagonalMove = rowDiff === colDiff && (rowDiff === 1 || rowDiff === 2)
  const isStraightMove =
    (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)

  return isDiagonalMove || isStraightMove
}
</script>

<template>
  <div>
    <div class="board grih-auto">
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
        <div
          v-for="(cell, cellIndex) in row"
          :key="cellIndex"
          class="cell"
          @click="selectCell(rowIndex, cellIndex)"
        >
          <div v-if="cell !== null" :class="['pawn', cell + '-pawn']"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board {
  height:100ch;
  justify-content:center;
  display: grid;
  grid-template-columns: repeat(6, 75px);
  grid-template-rows: repeat(6, 75px);
}

.cell {
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid;
  border-color: white;
  background-color: #333;
}

.pawn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.red-pawn {
  background-color: red;
}

.black-pawn {
  background-color: black;
}
</style>
