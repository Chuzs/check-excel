<template>
  <div style="width: 800px;">
  <a-form
    :model="formState"
    name="checkForm"
    v-bind="formItemLayout"
    layout="horizontal"
  >
    <a-form-item name="upload" label="总数据" >
      <a-upload
        v-model="formState.totalDataFileList"
        name="totalDataFile"
        :multiple="false"
        :before-upload="beforeTotalDataUpload"
        style="width: 100%"
      >
        <a-button>
          <UploadOutlined />
          上传总数据
        </a-button>
      </a-upload>
    </a-form-item>
    <a-form-item name="upload" label="待核对数据" >
      <a-upload
        v-model="formState.uncheckedDataFileList"
        name="uncheckedDataFile"
        :multiple="false"
        :before-upload="beforeUncheckedDataUpload"
      >
        <a-button>
          <UploadOutlined />
          上传待核对数据
        </a-button>
      </a-upload>
    </a-form-item>
    <a-form-item :wrapper-col="{ span: 12, offset: 6 }">
      <a-button
        type="primary"
        :loading="uploading"
        style="margin-top: 16px;"
        @click="handleUpload"
      >
        开始核对
      </a-button>
    </a-form-item>
  </a-form>
  <div style="margin-top: 16px">
    <a-textarea
    :value="JSON.stringify(result)"
    :auto-size="{ minRows: 2, maxRows: 50 }"
    >
    </a-textarea>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import XLSX from 'xlsx'
import { UploadOutlined } from '@ant-design/icons-vue'
import { BRAND_NAME, PATTERN } from '../share/contant'
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
}
const totalData = ref([])
const uncheckedExcelData = ref([])
const result = ref([])
const uploading = ref(false)
const formState = reactive({
  totalDataFileList: [],
  uncheckedDataFileList: []
})

const beforeTotalDataUpload = file => {
  formState.totalDataFileList = [file]
  return false
}
const beforeUncheckedDataUpload = file => {
  formState.uncheckedDataFileList = [file]
  return false
}
// const parseExcel = async (file) => {
//   const data = await file.arrayBuffer()
//   const workbook = XLSX.read(data)
//   const firstSheetName = workbook.SheetNames[0]
//   return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 })
// }
const parseTotalExcel = async (file) => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data)
  const sheetName = '2022价格'
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
}
const parseUncheckedExcel = async (file) => {
  const fileArrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(fileArrayBuffer)
  const firstSheetData = getArrayDataBySheetName(workbook, workbook.SheetNames[0])
  const secondSheetData = getArrayDataBySheetName(workbook, workbook.SheetNames[1])
  const result = []
  if (firstSheetData.length === secondSheetData.length) {
    for (let i = 0; i < firstSheetData.length; i++) {
      result.push({
        size: firstSheetData[i][3].split(' ')[0],
        pattern: PATTERN[firstSheetData[i][6]],
        forUnitPrice: firstSheetData[i][8],
        DDPWithoutFreightUnitPrice: firstSheetData[i][9],
        unitWeight: secondSheetData[i][8]
      })
    }
  } else {
    console.log('')
  }
  return result
}
const getArrayDataBySheetName = (workbook, sheetName) => {
  XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }).filter(item => item[2] === BRAND_NAME)
}
const handleUpload = async () => {
  totalData.value = await parseTotalExcel(formState.totalDataFileList[0])
  uncheckedExcelData.value = await parseUncheckedExcel(formState.uncheckedDataFileList[0])
  const uncheckedData = uncheckedExcelData.value.filter((item) => item[2] === BRAND_NAME)
  const sizeList = []
  uncheckedData.forEach(item => {
    sizeList.push(item[3].split(' ')[0])
  })
  const successData = []
  const failedData = []
  for (const item of uncheckedData) {
    let flag = true
    for (const elem of totalData.value) {
      if (item[3].split(' ')[0] === elem[1] && PATTERN[item[6]]) {
        flag = false
        if (item[8] === elem[1] && item[9] === elem[2]) {
          successData.push(item)
        } else {
          failedData.push(item)
        }
      }
    }
    if (flag) {
      failedData.push(item)
    }
  }

  result.value = sizeList
}
</script>

<style scoped>
</style>
