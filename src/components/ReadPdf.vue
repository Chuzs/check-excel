<template>
  <div style="width: 800px;">
  <a-form
    :model="formState"
    name="checkForm"
    v-bind="formItemLayout"
    layout="horizontal"
  >
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
        @click="handleCheck"
      >
        开始核对
      </a-button>
    </a-form-item>
    <a-form-item label="错误数据" >
      <a-textarea
    :value="JSON.stringify(failedData)"
    :auto-size="{ minRows: 2, maxRows: 50 }"
    >
    </a-textarea>
    </a-form-item>
    <a-form-item label="正确数据" >
     <a-textarea
      :value="JSON.stringify(successData)"
      :auto-size="{ minRows: 2, maxRows: 50 }"
      >
      </a-textarea>
    </a-form-item>
  </a-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import * as PDFJs from 'pdfjs-dist'

PDFJs.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/pdf.worker.js'
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 },
}
const successData = ref([])
const failedData = ref([])
const uploading = ref(false)
const formState = reactive({
  uncheckedDataFileList: [],
})
const beforeUncheckedDataUpload = file => {
  formState.uncheckedDataFileList = [file]
  return false
}
const uncheckedData = []
const orderInfo = {
  invNo: '',
  invDate: '',
  vessel: '',
  vesselDate: '',
  country: '',
  destination: '',
}
const pagesInfo = []
const handleCheck = async () => {
  const fileArrayBuffer = await formState.uncheckedDataFileList[0].arrayBuffer()
  const loadingTask = PDFJs.getDocument(fileArrayBuffer)
  const pdfDocument = await loadingTask.promise
  const pdfPageNum = pdfDocument._pdfInfo.numPages
  for (let i = 1; i <= pdfPageNum; i++) {
    pagesInfo.push(await getPageData(pdfDocument, i))
  }
  console.log(pagesInfo)
  console.log(uncheckedData)
}

const getPageData = async (pdfDocument, page) => {
  const pdfPage = await pdfDocument.getPage(page)
  const content = await pdfPage.getTextContent()
  const strings = content.items.map(function (item) {
    return item.str
  })
  const strArr = strings.filter(item => item.trim() !== '')
  const tmp = {}
  const pageInfo = {}
  for (let i = 0; i < strArr.length; i++) {
    if (strArr[i].indexOf('Inv. no.') > -1) {
      const arr = strArr[i].trim().split(' ')
      orderInfo.invNo = arr[3]
      orderInfo.invDate = arr[4]
    }
    if (strArr[i].indexOf('KKM0KPPPPLLNO') > -1) {
      orderInfo.vessel = strArr[i + 2]
      orderInfo.vesselDate = strArr[i + 3]
      orderInfo.country = strArr[i + 9].split(' ')[1] + strArr[i + 9].split(' ')[2] + strArr[i + 10].split(' ')[0]
      orderInfo.destination = strArr[i + 10].split(' ')[1] + strArr[i + 10].split(' ')[2] + strArr[i + 11]
    }
    if (strArr[i].trim() === 'MADE IN THAILAND') {
      tmp.quantity = parseInt(strArr[i + 1])
    }
    if (strArr[i].trim() === 'PASSENGER CAR RADIAL') {
      tmp.pcr = strArr[i + 1]
      tmp.weight = parseFloat(strArr[i + 3].split(' ')[0].replace(',', ''))
      tmp.quantity = tmp.quantity === parseInt(strArr[i + 4].split(' ')[0]) ? tmp.quantity : tmp.quantity + '_' + parseInt(strArr[i + 4].split(' ')[0])
    }
    if (strArr[i].trim() === 'FREE') {
      tmp.fob = parseFloat(strArr[i - 2].split(' ')[1].replace(',', ''))
      uncheckedData.push({ ...tmp })
    }
    if (strArr[i].indexOf('Total G.W.') > -1) {
      pageInfo.totalGw = parseFloat(strArr[i + 2].split(' ')[0].replace(',', ''))
      pageInfo.totalNw = parseFloat(strArr[i + 3].split(' ')[0].replace(',', ''))
      pageInfo.totalFob = parseFloat(strArr[i - 3].split(' ')[1].replace(',', ''))
      pageInfo.totalQty = parseInt(strArr[i + 5].split(' ')[0].replace(',', '')) === parseInt(strArr[i + 7].split(' ')[0].replace(',', '')) ? parseInt(strArr[i + 5].split(' ')[0].replace(',', '')) : parseInt(strArr[i + 5].split(' ')[0].replace(',', '')) + parseInt(strArr[i + 7].split(' ')[0].replace(',', ''))
    }
  }
  console.log(strArr.join('--'))
  // Release page resources.
  pdfPage.cleanup()
  return pageInfo
}

</script>

<style scoped>
</style>
