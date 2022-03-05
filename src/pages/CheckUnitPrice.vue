<template>
  <div>
    <div class="container">
      <a-form>
        <a-row type="flex" justify="space-between">
          <a-form-item name="totalDataFileList" label="总数据">
            <a-upload
              v-model:fileList="modelRef.totalDataFileList"
              name="totalDataFile"
              :multiple="false"
              :before-upload="beforeTotalDataUpload"
              @change="handleTotalChange"
              accept=".xlsx, .xls"
            >
              <a-button> <UploadOutlined />上传总数据 </a-button>
            </a-upload>
          </a-form-item>
          <a-form-item
            v-bind="validateInfos.uncheckedDataFileList"
            name="uncheckedDataFileList"
            label="待核对数据"
          >
            <a-upload
              v-model:fileList="modelRef.uncheckedDataFileList"
              name="uncheckedDataFile"
              :multiple="false"
              :before-upload="beforeUncheckedDataUpload"
              @change="handleUncheckedChange"
              accept=".xlsx, .xls"
            >
              <a-button> <UploadOutlined />上传待核对数据 </a-button>
            </a-upload>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleCheck">开始核对</a-button>
              <a-button type="primary" ghost @click="handelReset"
                >重置</a-button
              >
            </a-space>
          </a-form-item>
        </a-row>
      </a-form>
    </div>
    <div class="container" style="margin-top: 20px">
      <a-collapse v-model:activeKey="activeKey">
        <a-collapse-panel key="1" header="发票信息">
          <a-row type="flex" justify="space-around">
            <a-col>
              <h1>PACKING LIST</h1>
              <p
                v-for="item in packingInvData"
                :key="item"
                :style="{ color: item.color }"
              >
                {{ item.text }}
              </p>
            </a-col>
            <a-col>
              <h1>COMMERCIAL INVOICE ORIGINAL</h1>
              <p
                v-for="item in commercialInvData"
                :key="item"
                :style="{ color: item.color }"
              >
                {{ item.text }}
              </p>
            </a-col>
          </a-row>
        </a-collapse-panel>
        <a-collapse-panel
          key="2"
          :header="
            '总条数：' +
            (successData.length + failedData.length) +
            '，正确条数：' +
            successData.length +
            '，错误条数：' +
            failedData.length +
            '，重复条数：' +
            repeatList.length * 2
          "
        >
          <p>英文大写：{{ isUppercase.text }}</p>
          <a-table
            rowKey="size"
            :columns="columns"
            :data-source="[
              ...toRaw(failedData).sort((a, b) => a.pattern),
              ...toRaw(successData),
            ]"
            bordered
            size="small"
            :pagination="{
              pageSize: 25,
            }"
          >
            <template #bodyCell="{ column, text, record, index }">
              <template v-if="column.key === 'index'">
                <span>{{ index + 1 }}</span>
              </template>
              <template v-if="column.key === 'status'">
                <span>
                  <a-tag :color="record.status === 1 ? 'volcano' : 'green'">{{
                    record.status === 1 ? "错误" : "正确"
                  }}</a-tag>
                </span>
              </template>
              <template v-if="['size', 'pattern'].includes(column.key)">
                <span
                  :style="{
                    backgroundColor: repeatList.includes(
                      record.size + record.pattern
                    )
                      ? 'yellow'
                      : '',
                  }"
                  >{{ text }}</span
                >
              </template>
            </template>
            <!-- <template
          #title
        >总条数：{{ successData.length + failedData.length }}，正确条数：{{ successData.length }}，错误条数：{{ failedData.length }}</template> -->
          </a-table>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, toRaw } from "vue";
import XLSX from "xlsx";
import { UploadOutlined } from "@ant-design/icons-vue";
import {
  BRAND_NAME_GP,
  BRAND_NAME_LIST,
  BRAND_NAME_VR,
  BRAND_NAME_BY,
  BRAND_NAME_NA,
} from "../share/constant";
import { totalData as totalExcelData } from "../data/totalData.js";
import { fanmeiData } from "../data/fanmeiData";
import { Form, message } from "ant-design-vue";

const useForm = Form.useForm;
const columns = [
  {
    title: "index",
    dataIndex: "index",
    key: "index",
    align: "center",
  },
  {
    title: "pcr",
    dataIndex: "pcr",
    key: "pcr",
    align: "center",
  },
  {
    title: "size",
    dataIndex: "size",
    key: "size",
    align: "center",
  },
  {
    title: "pr",
    dataIndex: "pr",
    key: "pr",
    align: "center",
  },
  {
    title: "pattern",
    dataIndex: "pattern",
    key: "pattern",
    align: "center",
  },
  {
    title: "fob",
    dataIndex: "fob",
    key: "fob",
    align: "center",
  },
  {
    title: "ddp",
    dataIndex: "ddp",
    key: "ddp",
    align: "center",
  },
  {
    title: "weight",
    dataIndex: "weight",
    key: "weight",
    align: "center",
  },
  {
    title: "price",
    dataIndex: "price",
    key: "price",
    align: "center",
  },
  {
    title: "status",
    dataIndex: "status",
    key: "status",
    align: "center",
    filters: [
      {
        text: "正确",
        value: 0,
      },
      {
        text: "错误",
        value: 1,
      },
    ],
    onFilter: (value, record) => {
      console.log(record);
      return record.status === value;
    },
  },
  {
    title: "desc",
    dataIndex: "desc",
    key: "desc",
    align: "center",
  },
];

const activeKey = ref(["1", "2"]);
const modelRef = reactive({
  totalDataFileList: [],
  uncheckedDataFileList: [],
});
const rulesRef = reactive({
  uncheckedDataFileList: [
    {
      required: true,
      message: "Please upload file!",
    },
  ],
});
const { validate, validateInfos, resetFields } = useForm(modelRef, rulesRef);

let totalData = [...totalExcelData];
const beforeTotalDataUpload = (file) => {
  modelRef.totalDataFileList = [file];
  return false;
};
const beforeUncheckedDataUpload = (file) => {
  modelRef.uncheckedDataFileList = [file];
  return false;
};

const parseTotalExcel = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = "2022价格";
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: ["number", "pcr", "pr", "size", "pattern", "fob", "ddp", "weight"],
  });
};
const parseUncheckedExcel = async (file) => {
  const fileArrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(fileArrayBuffer);
  const firstSheetData = getArrayDataBySheetName(
    workbook,
    workbook.SheetNames[0]
  );
  const secondSheetData = getArrayDataBySheetName(
    workbook,
    workbook.SheetNames[1]
  );
  const firstSheetOtherData = getOtherDataBySheetName(
    workbook,
    workbook.SheetNames[0]
  );
  console.log(firstSheetOtherData);
  parsecommercialInvoice(firstSheetOtherData);
  const secondSheetOtherData = getOtherDataBySheetName(
    workbook,
    workbook.SheetNames[1]
  );
  parseInvoice(secondSheetOtherData);
  compareInvData(packingInvData, commercialInvData);
  let result = [];
  switch (brandName.value) {
    case BRAND_NAME_VR:
      result = getVRData(firstSheetData, secondSheetData);
      break;
    default:
      result = getGPData(firstSheetData, secondSheetData);
      break;
  }
  return result;
};
const brandName = ref(BRAND_NAME_GP);
const getArrayDataBySheetName = (workbook, sheetName) => {
  const sheetData = XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
    .filter(
      (item) =>
        BRAND_NAME_LIST.includes(item[2]) || BRAND_NAME_LIST.includes(item[1])
    );
  if (sheetData[0][2] === BRAND_NAME_GP) {
    brandName.value = BRAND_NAME_GP;
  }
  if (sheetData[0][2] === BRAND_NAME_VR) {
    brandName.value = BRAND_NAME_VR;
  }
  if (sheetData[0][1] === BRAND_NAME_NA) {
    brandName.value = BRAND_NAME_NA;
  }
  if (sheetData[0][2] === BRAND_NAME_BY) {
    brandName.value = BRAND_NAME_BY;
  }
  return sheetData;
};
const getOtherDataBySheetName = (workbook, sheetName) => {
  return XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
    .filter(
      (item) =>
        !(
          BRAND_NAME_LIST.includes(item[2]) || BRAND_NAME_LIST.includes(item[1])
        )
    )
    .filter((item) => item.length > 0);
};
const packingInvData = reactive([]);
const parseInvoice = (secondSheetOtherData) => {
  let invNoIndex = 4;
  let invDateIndex = 5;
  let contractNoIndex = 6;
  switch (brandName.value) {
    case BRAND_NAME_NA:
    case BRAND_NAME_BY:
    case BRAND_NAME_VR:
      invNoIndex = 3;
      invDateIndex = 4;
      contractNoIndex = 5;
      break;
    case BRAND_NAME_GP:
      break;
    default:
      break;
  }
  packingInvData.push({
    text: secondSheetOtherData[invNoIndex][
      secondSheetOtherData[invNoIndex].length - 1
    ],
  });
  packingInvData.push({
    text: secondSheetOtherData[invDateIndex][
      secondSheetOtherData[invDateIndex].length - 1
    ],
  });
  packingInvData.push({
    text: secondSheetOtherData[contractNoIndex][
      secondSheetOtherData[contractNoIndex].length - 1
    ],
  });
};
const commercialInvData = reactive([]);
let isUppercase = reactive({ value: "正确", text: "" });
const parsecommercialInvoice = (otherData) => {
  let invNoIndex = 4;
  let invDateIndex = 5;
  let contractNoIndex = 6;
  let totalAmountIndex = 15;
  switch (brandName.value) {
    case BRAND_NAME_NA:
    case BRAND_NAME_BY:
    case BRAND_NAME_VR:
      // invNoIndex = 3;
      // invDateIndex = 4;
      // contractNoIndex = 5;
      break;
    case BRAND_NAME_GP:
      break;
    default:
      break;
  }
  commercialInvData.push({
    text: otherData[invNoIndex][otherData[invNoIndex].length - 1],
  });
  commercialInvData.push({
    text: otherData[invDateIndex][otherData[invDateIndex].length - 1],
  });
  commercialInvData.push({
    text: otherData[contractNoIndex][otherData[contractNoIndex].length - 1],
  });
  const totalAmount =
    otherData[totalAmountIndex][otherData[totalAmountIndex].length - 1];
  // if (totalAmount != totalAmount.toUpperCase()) {
  //   isUppercase.value = "错误";
  // } else {
  //   isUppercase.value = "正确";
  // }
  isUppercase.text = totalAmount;
};
const compareInvData = (a, b) => {
  for (let i = 0; i < a.length; i++) {
    if (i == 1) {
      if (a[i].text.toUpperCase() != b[i].text.toUpperCase()) {
        a[i].color = "red";
        b[i].color = "red";
      }
    } else {
      if (a[i].text != b[i].text) {
        a[i].color = "red";
        b[i].color = "red";
      }
    }
  }
};
const repeatList = ref([]);
const successData = ref([]);
const failedData = ref([]);
const handleCheck = () => {
  validate()
    .then(async () => {
      const uncheckedData = await parseUncheckedExcel(
        modelRef.uncheckedDataFileList[0].originFileObj
      );
      switch (brandName.value) {
        case BRAND_NAME_VR:
          totalData = fanmeiData;
          break;
        default:
          break;
      }
      if (modelRef.totalDataFileList[0]) {
        totalData = await parseTotalExcel(
          modelRef.totalDataFileList[0].originFileObj
        );
      }

      const sizeList = [];
      repeatList.value = [];
      uncheckedData.forEach((item) => {
        if (sizeList.includes(item.size + item.pattern)) {
          repeatList.value.push(item.size + item.pattern);
        } else {
          sizeList.push(item.size + item.pattern);
        }
      });
      successData.value = [];
      failedData.value = [];
      console.log(totalData);
      console.log(uncheckedData);
      for (const item of uncheckedData) {
        let flag = true;
        for (const elem of totalData) {
          if (
            item.size.trim().toUpperCase() === elem.size.trim().toUpperCase() &&
            item.pattern.trim().toUpperCase() ===
              elem.pattern.trim().toUpperCase()
          ) {
            flag = false;
            switch (brandName.value) {
              case BRAND_NAME_GP:
                if (isEqual(item, elem)) {
                  successData.value.push({ ...item, status: 0 });
                } else {
                  console.log(elem);
                  console.log(item);
                  failedData.value.push({
                    ...getErrData(item, elem),
                    status: 1,
                  });
                }
                break;
              case BRAND_NAME_VR:
                if (isFanmeiEqual(item, elem)) {
                  successData.value.push({ ...item, status: 0 });
                } else {
                  console.log(elem);
                  console.log(item);
                  failedData.value.push({
                    ...getFanmeiErrData(item, elem),
                    status: 1,
                  });
                }
                break;
              default:
                break;
            }
          }
        }
        if (flag) {
          console.log(item);
          failedData.value.push({ ...item, status: 1 });
        }
      }
    })
    .catch((err) => {
      console.log("error", err);
    });
};
const handleUncheckedChange = (info) => {
  const resFileList = [...info.fileList];
  modelRef.uncheckedDataFileList = resFileList.slice(-1);
};
const handleTotalChange = (info) => {
  const resFileList = [...info.fileList];
  modelRef.totalDataFileList = resFileList.slice(-1);
};
const handelReset = () => {
  resetFields();
  successData.value = [];
  failedData.value = [];
  repeatList.value = [];
  isUppercase = { value: "正确", text: "" };
  packingInvData.length = 0;
  commercialInvData.length = 0;
};
// 判断单价、重量是否相等
const isEqual = (a, b) => {
  return (
    a.fob === b.fob &&
    a.ddp === b.ddp &&
    a.weight === b.weight &&
    a.pr === b.pr &&
    a.pcr === b.pcr
  );
};
const isFanmeiEqual = (a, b) => {
  return (
    a.price === b.price &&
    a.weight === b.weight &&
    a.pr === b.pr &&
    a.pcr === b.pcr
  );
};
const getErrData = (a, b) => {
  const err = { ...a };
  if (a.fob !== b.fob) {
    err.fob = "预报关：" + a.fob + " -- " + "2022价格表：" + b.fob;
  }
  if (a.ddp !== b.ddp) {
    err.ddp = "预报关：" + a.ddp + " -- " + "2022价格表：" + b.ddp;
  }
  if (a.weight !== b.weight) {
    err.weight = "预报关：" + a.weight + " -- " + "2022价格表：" + b.weight;
  }
  if (a.pr !== b.pr) {
    err.pr = "预报关：" + a.pr + " -- " + "2022价格表：" + b.pr;
  }
  if (a.pcr !== b.pcr) {
    err.pcr = "预报关：" + a.pcr + " -- " + "2022价格表：" + b.pcr;
  }
  return err;
};
const getFanmeiErrData = (a, b) => {
  const err = { ...a };
  if (a.price !== b.price) {
    err.price = "预报关：" + a.price + " -- " + "价格表：" + b.price;
  }
  if (a.weight !== b.weight) {
    err.weight = "预报关：" + a.weight + " -- " + "价格表：" + b.weight;
  }
  if (a.pr !== b.pr) {
    err.pr = "预报关：" + a.pr + " -- " + "价格表：" + b.pr;
  }
  if (a.pcr !== b.pcr) {
    err.pcr = "预报关：" + a.pcr + " -- " + "价格表：" + b.pcr;
  }
  return err;
};

function getGPData(firstSheetData, secondSheetData) {
  const result = [];
  if (firstSheetData.length === secondSheetData.length) {
    for (let i = 0; i < firstSheetData.length; i++) {
      result.push({
        size:
          firstSheetData[i][3].split(" ")[0] ===
          secondSheetData[i][3].split(" ")[0]
            ? secondSheetData[i][3].split(" ")[0]
            : firstSheetData[i][3].split(" ")[0] +
              "_" +
              secondSheetData[i][3].split(" ")[0],
        pattern:
          firstSheetData[i][6] === secondSheetData[i][6]
            ? secondSheetData[i][6]
            : firstSheetData[i][6] + "_" + secondSheetData[i][6],
        fob: firstSheetData[i][8],
        ddp: firstSheetData[i][9],
        weight: secondSheetData[i][8],
        pr:
          firstSheetData[i][5] === secondSheetData[i][5]
            ? secondSheetData[i][5]
            : firstSheetData[i][5] + "_" + secondSheetData[i][5],
        pcr:
          firstSheetData[i][1] === secondSheetData[i][1]
            ? secondSheetData[i][1]
            : firstSheetData[i][1] + "_" + secondSheetData[i][1],
      });
    }
  } else {
    console.log("PACKING LIST 和 COMMERCIAL INVOICE 数量不一致");
    message.warning("PACKING LIST 和 COMMERCIAL INVOICE 数量不一致");
  }
  return result;
}
function getVRData(firstSheetData, secondSheetData) {
  const result = [];
  if (firstSheetData.length === secondSheetData.length) {
    for (let i = 0; i < firstSheetData.length; i++) {
      result.push({
        size:
          firstSheetData[i][3] === secondSheetData[i][3]
            ? secondSheetData[i][3]
            : firstSheetData[i][3] + "_" + secondSheetData[i][3],
        pattern:
          firstSheetData[i][6] === secondSheetData[i][6]
            ? secondSheetData[i][6]
            : firstSheetData[i][6] + "_" + secondSheetData[i][6],
        price: firstSheetData[i][8],
        weight: secondSheetData[i][8],
        pr:
          firstSheetData[i][5] === secondSheetData[i][5]
            ? secondSheetData[i][5]
            : firstSheetData[i][5] + "_" + secondSheetData[i][5],
        pcr:
          firstSheetData[i][1] === secondSheetData[i][1]
            ? secondSheetData[i][1]
            : firstSheetData[i][1] + "_" + secondSheetData[i][1],
      });
    }
  } else {
    console.log("PACKING LIST 和 COMMERCIAL INVOICE 数量不一致");
    message.warning("PACKING LIST 和 COMMERCIAL INVOICE 数量不一致");
  }
  return result;
}
</script>

<style scoped>
.container {
  background: #fff;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
}
</style>
