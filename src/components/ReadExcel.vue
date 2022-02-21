<template>
  <div style="width: 800px">
    <a-form
      :model="formState"
      name="checkForm"
      v-bind="formItemLayout"
      layout="horizontal"
    >
      <a-form-item name="upload" label="总数据">
        <a-upload
          v-model="formState.totalDataFileList"
          name="totalDataFile"
          :multiple="false"
          :before-upload="beforeTotalDataUpload"
          style="width: 100%"
        >
          <a-button>
            <UploadOutlined />上传总数据
          </a-button>
        </a-upload>
      </a-form-item>
      <a-form-item name="upload" label="待核对数据">
        <a-upload
          v-model="formState.uncheckedDataFileList"
          name="uncheckedDataFile"
          :multiple="false"
          :before-upload="beforeUncheckedDataUpload"
        >
          <a-button>
            <UploadOutlined />上传待核对数据
          </a-button>
        </a-upload>
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 12, offset: 6 }">
        <a-button
          type="primary"
          style="margin-top: 16px"
          @click="handleUpload"
        >开始核对</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { utils, read, writeFile } from "xlsx";
import { UploadOutlined } from "@ant-design/icons-vue";
import { BRAND_NAME_GP } from "../share/constant";
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 },
};
const {
  encode_cell,
  decode_cell,
  encode_col,
  decode_col,
  encode_range,
  decode_range,
  encode_row,
  decode_row,
  sheet_to_json,
} = utils;
const formState = reactive({
  totalDataFileList: [],
  uncheckedDataFileList: [],
});
const invNo = ''

const beforeTotalDataUpload = (file) => {
  formState.totalDataFileList = [file];
  return false;
};
const beforeUncheckedDataUpload = (file) => {
  formState.uncheckedDataFileList = [file];
  return false;
};

const parseToTcExcel = async (file) => {
  const invNo = file.name.split(' ')[3]
  console.log(invNo);
  const fileArrayBuffer = await file.arrayBuffer();
  const workbook = read(fileArrayBuffer, { cellStyles: true });
  writeFile(workbook, 'test1.xls', { bookType: 'xlml' })
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  console.log(ws);
  const firstSheetData = getArrayDataBySheetName(workbook, workbook.SheetNames[0])
  console.log(firstSheetData);
  const toTcData = []
  for (let i = 0; i < firstSheetData.length; i++) {
    toTcData.push({
      po: firstSheetData[i][3],
      spn: firstSheetData[i][4],
      quantity: firstSheetData[i][11],
      invNo,
    })
  }
  console.log(toTcData);
  return toTcData
}
const getArrayDataBySheetName = (workbook, sheetName) => {
  return sheet_to_json(workbook.Sheets[sheetName], { header: 1 }).filter(
    (item) => item[6] === BRAND_NAME_GP,
  );
};
const getWsByIndex = async (file, index) => {
  const fileArrayBuffer = await file.arrayBuffer();
  const workbook = read(fileArrayBuffer);
  const ws = workbook.Sheets[workbook.SheetNames[index]];
  return ws;
}
const getColNum = (ws, invNo, po) => {
  let col = 0
  const range = decode_range("A1:IV1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let invCellAddress = { c: C, r: R };
      let poCellAddress = { c: C, r: 2 };
      let invCellRef = encode_cell(invCellAddress);
      let poCellRef = encode_cell(poCellAddress)
      if (ws[invCellRef]?.v == invNo && ws[poCellRef]?.v == po) {
        col = decode_cell(invCellRef).c
      }
    }
  }
  return col
}
const getRowNum = (ws, spn) => {
  let row = 0
  const range = decode_range("B6:B147");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let spnCellAdress = { c: C, r: R };
      let spnCellRef = encode_cell(spnCellAdress);
      if (ws[spnCellRef]?.v == spn) {
        row = decode_cell(spnCellRef).r
      }
    }
  }
  return row
}
const handleUpload = async () => {
  const toTcData = await parseToTcExcel(formState.totalDataFileList[0])
  // const ws = await getWsByIndex(formState.uncheckedDataFileList[0], 0);
  // const fileArrayBuffer = await formState.uncheckedDataFileList[0].arrayBuffer();
  // const workbook = read(fileArrayBuffer, { cellStyles: true });
  // const ws = workbook.Sheets[workbook.SheetNames[0]];
  // console.log(workbook);
  // for (const item of toTcData) {
  //   handleMinus(ws, item)
  // }
  // writeFile(workbook, 'test.xls', { bookType: 'xlml' })
};
const handleMinus = (ws, totc) => {
  let unMinusAddress = { c: getColNum(ws, totc.invNo, totc.po), r: getRowNum(ws, totc.spn) }
  let unMinusCellRef = encode_cell(unMinusAddress);
  console.log(unMinusCellRef);
  let orign = ws[unMinusCellRef]?.v
  ws[unMinusCellRef].w = undefined
  ws[unMinusCellRef].v -= totc.quantity
  console.log({ orign, quantity: totc.quantity, final: ws[unMinusCellRef]?.v });
}


</script>

<style scoped></style>
