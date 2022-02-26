<template>
  <div>
    <div class="container">
      <a-form>
        <a-row type="flex" justify="space-between">
          <a-form-item
            v-bind="validateInfos.totalDataFileList"
            name="totalDataFileList"
            label="预报关"
          >
            <a-upload
              v-model:fileList="modelRef.totalDataFileList"
              name="totalDataFile"
              :multiple="false"
              :before-upload="beforeTotalDataUpload"
              @change="handleTotalChange"
              accept=".xlsx, .xls"
            >
              <a-button>
                <UploadOutlined />上传预报关
              </a-button>
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
              accept=".pdf"
            >
              <a-button>
                <UploadOutlined />上传待核对数据
              </a-button>
            </a-upload>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleCheck">开始核对</a-button>
              <a-button type="primary" ghost @click="handelReset">重置</a-button>
            </a-space>
          </a-form-item>
        </a-row>
      </a-form>
    </div>
    <div class="container" style="margin-top: 20px">
      <a-collapse v-model:activeKey="activeKey">
        <a-collapse-panel
          key="1"
          :header="
            '单个数据错误条数：' +
            failedData.length +
            '，正确条数：' +
            successData.length
          "
        >
          <a-table
            rowKey="size"
            :columns="dataColumns"
            :data-source="[...toRaw(failedData), ...toRaw(successData)]"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <span>
                  <a-tag :color="record.status === 1 ? 'volcano' : 'green'">
                    {{
                      record.status === 1 ? "错误" : "正确"
                    }}
                  </a-tag>
                </span>
              </template>
            </template>
          </a-table>
        </a-collapse-panel>
        <a-collapse-panel
          key="2"
          :header="
            '每页汇总数据错误条数：' +
            failedPages.length +
            '，正确条数：' +
            successPages.length
          "
        >
          <a-table
            rowKey="size"
            :columns="pageColumns"
            :data-source="[...toRaw(failedPages), ...toRaw(successPages)]"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <span>
                  <a-tag :color="record.status === 1 ? 'volcano' : 'green'">
                    {{
                      record.status === 1 ? "错误" : "正确"
                    }}
                  </a-tag>
                </span>
              </template>
            </template>
          </a-table>
        </a-collapse-panel>
        <a-collapse-panel
          key="3"
          :header="'发票船号日期：' + (orderInfoSuccess ? '正确' : '错误')"
        >
          <a-table
            rowKey="size"
            :columns="orderColumns"
            :data-source="[
              { ...toRaw(totalOrderInfo), type: '预报关' },
              { ...toRaw(uncheckedOrderInfo), type: 'pdf' },
            ]"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, text, record }">
              <template v-if="column.key === 'invDate'">
                <span
                  :style="{
                    color: record?.errList?.includes(column.key)
                      ? 'red'
                      : 'black',
                  }"
                >
                  {{
                    record.invDate && record.invDate.format("YYYY-MM-DD")
                  }}
                </span>
              </template>
              <template v-if="column.key === 'vesselDate'">
                <span
                  :style="{
                    color: record?.errList?.includes(column.key)
                      ? 'red'
                      : 'black',
                  }"
                >
                  {{
                    record.vesselDate && record.vesselDate.format("YYYY-MM-DD")
                  }}
                </span>
              </template>
              <template
                v-if="
                  ['invNo', 'vessel', 'country', 'destination'].includes(
                    column.key
                  )
                "
              >
                <span
                  :style="{
                    color: record?.errList?.includes(column.key)
                      ? 'red'
                      : 'black',
                  }"
                >{{ text }}</span>
              </template>
            </template>
          </a-table>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, toRaw } from "vue";
import XLSX from "xlsx";
import moment from "moment";
import { UploadOutlined } from "@ant-design/icons-vue";
import {
  BRAND_NAME_LIST,
  BRAND_NAME_BY,
  BRAND_NAME_NA,
  BRAND_NAME_VR,
  BRAND_NAME_GP,
} from "../share/constant";
import { Form } from "ant-design-vue";
import * as PDFJs from "pdfjs-dist";

PDFJs.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.js";
let uncheckedData = [];
const uncheckedOrderInfo = reactive({
  invNo: "",
  invDate: "",
  vessel: "",
  vesselDate: "",
  country: "",
  destination: "",
  errList: [],
});
let uncheckedPagesInfo = [];
let totalPagesInfo = [];
let totalData = [];
let numList = [];
const totalOrderInfo = reactive({
  invNo: "",
  invDate: "",
  vessel: "",
  vesselDate: "",
  country: "",
  destination: "",
});
const useForm = Form.useForm;
const dataColumns = [
  {
    title: "pcr",
    dataIndex: "pcr",
    key: "pcr",
    align: "center",
  },
  {
    title: "fob",
    dataIndex: "fob",
    key: "fob",
    align: "center",
  },
  {
    title: "quantity",
    dataIndex: "quantity",
    key: "quantity",
    align: "center",
  },
  {
    title: "weight",
    dataIndex: "weight",
    key: "weight",
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
const pageColumns = [
  {
    title: "totalGw",
    dataIndex: "totalGw",
    key: "totalGw",
    align: "center",
  },
  {
    title: "totalFob",
    dataIndex: "totalFob",
    key: "totalFob",
    align: "center",
  },
  {
    title: "totalNw",
    dataIndex: "totalNw",
    key: "totalNw",
    align: "center",
  },
  {
    title: "totalQty",
    dataIndex: "totalQty",
    key: "totalQty",
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
const orderColumns = [
  {
    title: "type",
    dataIndex: "type",
    key: "type",
    align: "center",
  },
  {
    title: "invNo",
    dataIndex: "invNo",
    key: "invNo",
    align: "center",
  },
  {
    title: "invDate",
    dataIndex: "invDate",
    key: "invDate",
    align: "center",
  },
  {
    title: "vessel",
    dataIndex: "vessel",
    key: "vessel",
    align: "center",
  },
  {
    title: "vesselDate",
    dataIndex: "vesselDate",
    key: "vesselDate",
    align: "center",
  },
  {
    title: "country",
    dataIndex: "country",
    key: "country",
    align: "center",
  },
  {
    title: "destination",
    dataIndex: "destination",
    key: "destination",
    align: "center",
  },
];
const activeKey = ref(["3"]);
const successData = ref([]);
const failedData = ref([]);
const successPages = ref([]);
const failedPages = ref([]);
const brand = ref("");
const orderInfoSuccess = ref(true);
const modelRef = reactive({
  totalDataFileList: [],
  uncheckedDataFileList: [],
});
const rulesRef = reactive({
  totalDataFileList: [
    {
      required: true,
      message: "Please upload file!",
    },
  ],
  uncheckedDataFileList: [
    {
      required: true,
      message: "Please upload file!",
    },
  ],
});
const { validate, validateInfos, resetFields } = useForm(modelRef, rulesRef);

const beforeTotalDataUpload = (file) => {
  modelRef.totalDataFileList = [file];
  return false;
};
const beforeUncheckedDataUpload = (file) => {
  modelRef.uncheckedDataFileList = [file];
  return false;
};

const parseUncheckedPdf = async (file) => {
  const fileArrayBuffer = await file.arrayBuffer();
  const loadingTask = PDFJs.getDocument(fileArrayBuffer);
  const pdfDocument = await loadingTask.promise;
  const pdfPageNum = pdfDocument._pdfInfo.numPages;

  const getPageData = await getPageDataFunction(pdfDocument);
  for (let i = 1; i <= pdfPageNum; i++) {
    const pageInfo = await getPageData(pdfDocument, i);
    if (pageInfo.totalFob) {
      uncheckedPagesInfo.push(pageInfo);
    }
  }
  console.log(uncheckedPagesInfo);
  console.log(uncheckedData);
  console.log(uncheckedOrderInfo);
};
const getPageDataFunction = async (pdfDocument) => {
  const pdfPage = await pdfDocument.getPage(1);
  const content = await pdfPage.getTextContent();
  const strings = content.items.map(function (item) {
    return item.str;
  });
  const strArr = strings.filter((item) => item.trim() !== "");
  for (let i = 0; i < strArr.length; i++) {
    if (strArr[i].indexOf("KKM0KPPPPLLNO") > -1) {
      brand.value = "suzuyo";
      return getSuzuyoPageData;
    }
    if (strArr[i].indexOf("1100800792910") > -1) {
      brand.value = "draft";
      return getDraftPageData;
    }
    if (strArr[i].indexOf("0215564001841") > -1) {
      brand.value = "yifan";
      return getYifanPageData;
    }
  }
};
const getSuzuyoPageData = async (pdfDocument, page) => {
  const pdfPage = await pdfDocument.getPage(page);
  const content = await pdfPage.getTextContent();
  const strings = content.items.map(function (item) {
    return item.str;
  });
  const strArr = strings.filter((item) => item.trim() !== "");
  const tmp = {};
  const pageInfo = {};
  for (let i = 0; i < strArr.length; i++) {
    if (strArr[i].indexOf("Inv. no.") > -1) {
      const arr = strArr[i].trim().split(" ");
      uncheckedOrderInfo.invNo = arr[3];
      uncheckedOrderInfo.invDate = moment(arr[4], "DD-MM-YYYY");
    }
    if (strArr[i].indexOf("KKM0KPPPPLLNO") > -1) {
      uncheckedOrderInfo.vessel = strArr[i + 2].trim();
      uncheckedOrderInfo.vesselDate = moment(
        strArr[i + 3],
        "DD-MM-YYYY",
      ).subtract(543, "years");
      uncheckedOrderInfo.country =
        strArr[i + 9].split(" ")[1] +
        strArr[i + 9].split(" ")[2] +
        strArr[i + 10].split(" ")[0];
      // uncheckedOrderInfo.destination = strArr[i + 11].split(' ')[0] + strArr[i + 11].split(' ')[1] + strArr[i + 12]
      uncheckedOrderInfo.destination =
        strArr[i + 10].split(" ")[1] +
        strArr[i + 10].split(" ")[2] +
        strArr[i + 11];
    }
    if (strArr[i].indexOf("สทบ.") > -1) {
      uncheckedOrderInfo.country =
        strArr[i + 1].split(" ")[1] +
        praseStrEmpty(strArr[i + 1].split(" ")[2]) +
        strArr[i + 2].split(" ")[0];
      uncheckedOrderInfo.destination =
        strArr[i + 2].split(" ")[1] +
        praseStrEmpty(strArr[i + 2].split(" ")[2]) +
        strArr[i + 3];
    }
    if (strArr[i].trim() === "MADE IN THAILAND") {
      tmp.quantity = parseInt(strArr[i + 1]);
    }
    if (strArr[i].trim() === "PASSENGER CAR RADIAL") {
      tmp.pcr = strArr[i + 1];
      tmp.weight = parseFloat(strArr[i + 3].split(" ")[0].replace(",", ""));
      tmp.quantity =
        tmp.quantity === parseInt(strArr[i + 4].split(" ")[0])
          ? tmp.quantity
          : tmp.quantity + "_" + parseInt(strArr[i + 4].split(" ")[0]);
    }
    if (strArr[i].trim() === "TRUCK BUS RADIAL TYRE") {
      tmp.pcr = strArr[i + 1];
      tmp.weight = parseFloat(strArr[i + 3].split(" ")[0].replace(",", ""));
      tmp.quantity =
        tmp.quantity === parseInt(strArr[i + 4].split(" ")[0])
          ? tmp.quantity
          : tmp.quantity + "_" + parseInt(strArr[i + 4].split(" ")[0]);
    }
    if (strArr[i].trim() === "FREE") {
      tmp.fob = parseFloat(strArr[i - 2].split(" ")[1].replace(",", ""));
      uncheckedData.push({ ...tmp });
    }
    if (strArr[i].indexOf("Total G.W.") > -1) {
      pageInfo.totalNw = parseFloat(
        strArr[i + 3].split(" ")[0].replace(",", ""),
      );
      if (numList.length === pdfDocument._pdfInfo.numPages - 1) {
        pageInfo.totalFob = parseFloat(
          strArr[i - 4].split(" ")[1].replace(",", ""),
        );
      } else {
        pageInfo.totalFob = parseFloat(
          strArr[i - 3].split(" ")[1].replace(",", ""),
        );
      }
      pageInfo.totalQty =
        parseInt(strArr[i + 5].split(" ")[0].replace(",", "")) ===
          parseInt(strArr[i + 7].split(" ")[0].replace(",", ""))
          ? parseInt(strArr[i + 5].split(" ")[0].replace(",", ""))
          : parseInt(strArr[i + 5].split(" ")[0].replace(",", "")) +
          parseInt(strArr[i + 7].split(" ")[0].replace(",", ""));
      pageInfo.totalGw = parseFloat(
        strArr[i + 2].split(" ")[0].replace(",", ""),
      );
    }
  }
  console.log(strArr.join("--"));
  numList.push(uncheckedData.length);
  // Release page resources.
  pdfPage.cleanup();
  return pageInfo;
};
const getDraftPageData = async (pdfDocument, page) => {
  const pdfPage = await pdfDocument.getPage(page);
  const content = await pdfPage.getTextContent();
  const strings = content.items.map(function (item) {
    return item.str;
  });
  const strArr = strings.filter((item) => item.trim() !== "");
  const tmp = {};
  const pageInfo = {};
  for (let i = 0; i < strArr.length; i++) {
    if (strArr[i].indexOf("INV# GR") > -1) {
      const arr = strArr[i].trim().split(" ");
      uncheckedOrderInfo.invNo = arr[1];
      uncheckedOrderInfo.invDate = moment(arr[2], "DD-MM-YYYY");
      uncheckedOrderInfo.vessel = strArr[i + 2] + " " + strArr[i + 3];
      uncheckedOrderInfo.vesselDate = moment(
        strArr[i + 4],
        "DD-MM-YYYY",
      ).subtract(543, "years");
    }
    if (strArr[i].indexOf("ทางเรือ") > -1) {
      uncheckedOrderInfo.vessel = strArr[i - 3] + " " + strArr[i - 2];
      uncheckedOrderInfo.vesselDate = moment(
        strArr[i - 1],
        "DD-MM-YYYY",
      ).subtract(543, "years");
    }
    if (strArr[i].indexOf("1.00 USD =") > -1 && page === 1) {
      uncheckedOrderInfo.country =
        strArr[i - 4].replace(" ", "") + strArr[i - 3];
      uncheckedOrderInfo.destination =
        strArr[i - 2].replace(" ", "") + strArr[i - 1];
    }
    if (page === 1 && strArr[i].trim() === "PASSENGER CAR RADIAL") {
      tmp.pcr = strArr[i + 1];
      tmp.weight = parseFloat(strArr[i - 1].split(" ")[0].replace(",", ""));
      tmp.quantity = parseInt(strArr[i - 3].split(" ")[0]);
      tmp.quantity =
        tmp.quantity === parseInt(strArr[i - 2].split(" ")[0])
          ? tmp.quantity
          : tmp.quantity + "_" + parseInt(strArr[i - 2].split(" ")[0]);
      tmp.fob = parseFloat(strArr[i - 7].split(" ")[1].replace(",", ""));
      uncheckedData.push({ ...tmp });
    } else if (strArr[i].trim() === "PASSENGER CAR RADIAL") {
      tmp.pcr = strArr[i + 1];
      tmp.weight = parseFloat(strArr[i + 6].split(" ")[0].replace(",", ""));
      tmp.quantity = parseInt(strArr[i - 1].split(" ")[0]);
      tmp.quantity =
        tmp.quantity === parseInt(strArr[i + 11].split(" ")[0])
          ? tmp.quantity
          : tmp.quantity + "_" + parseInt(strArr[i + 11].split(" ")[0]);
      tmp.fob = parseFloat(strArr[i + 5].split(" ")[1].replace(",", ""));
      uncheckedData.push({ ...tmp });
    }
    if (page === 1 && strArr[i].indexOf("NW =") > -1) {
      pageInfo.totalNw = parseFloat(strArr[i].split(" ")[2].replace(",", ""));
      pageInfo.totalFob = parseFloat(
        strArr[i - 1].split(" ")[1].replace(",", ""),
      );
      pageInfo.totalQty = parseInt(
        strArr[i + 1].split(" ")[2].replace(",", ""),
      );
      pageInfo.totalGw = parseFloat(
        strArr[i + 2].split(" ")[2].replace(",", ""),
      );
    } else if (strArr[i].indexOf("GW =") > -1) {
      pageInfo.totalQty = parseInt(
        strArr[i - 1].split(" ")[2].replace(",", ""),
      );
      pageInfo.totalGw = parseFloat(strArr[i].split(" ")[2].replace(",", ""));
    } else if (strArr[i].indexOf("NW =") > -1) {
      pageInfo.totalNw = parseFloat(strArr[i].split(" ")[2].replace(",", ""));
      pageInfo.totalFob = parseFloat(
        strArr[i - 2].split(" ")[1].replace(",", ""),
      );
    }
  }
  console.log(strArr.join("--"));
  numList.push(uncheckedData.length);
  // Release page resources.
  pdfPage.cleanup();
  return pageInfo;
};
const getYifanPageData = async (pdfDocument, page) => {
  const pdfPage = await pdfDocument.getPage(page);
  const content = await pdfPage.getTextContent();
  const strings = content.items.map(function (item) {
    return item.str;
  });
  const strArr = strings.filter((item) => item.trim() !== "");
  const tmp = {};
  const pageInfo = {};
  for (let i = 0; i < strArr.length; i++) {
    if (strArr[i].indexOf("InvNo:") > -1 && strArr[i].indexOf("/") > -1) {
      const arr = strArr[i].trim().split(" ");
      uncheckedOrderInfo.invNo = arr[0].split(":")[1];
      uncheckedOrderInfo.invDate = moment(arr[1], "DD-MM-YYYY");
    }
    if (strArr[i].indexOf("0215564001841") > -1) {
      uncheckedOrderInfo.vessel = strArr[i + 4];
      uncheckedOrderInfo.vesselDate = moment(
        strArr[i + 5],
        "DD-MM-YYYY",
      ).subtract(543, "years");
      uncheckedOrderInfo.country =
        strArr[i + 13].replace(" ", "") + strArr[i + 11];
      uncheckedOrderInfo.destination =
        strArr[i + 14].replace(" ", "") + strArr[i + 12];
    }
    if (strArr[i].trim() === "MADE IN THAILAND") {
      tmp.weight = parseFloat(strArr[i + 4].split(" ")[0].replace(",", ""));
      tmp.quantity = parseInt(strArr[i + 1].replace(",", ""));
      if (page === 1) {
        // tmp.quantity = tmp.quantity === parseInt(strArr[i + 5].split(' ')[0].replace(',', '')) ? tmp.quantity : tmp.quantity + '_' + parseInt(strArr[i + 5].split(' ')[0].replace(',', ''))
      }
      if (page !== 1) {
        // tmp.quantity = tmp.quantity === parseInt(strArr[i + 8].split(' ')[0].replace(',', '')) ? tmp.quantity : tmp.quantity + '_' + parseInt(strArr[i + 8].split(' ')[0].replace(',', ''))
        tmp.fob = parseFloat(strArr[i + 7].split(" ")[1].replace(",", ""));
      }
    }
    if (strArr[i].trim() === "PASSENGER CAR RADIAL") {
      if (page === 1) {
        tmp.fob = parseFloat(strArr[i - 7].split(" ")[1].replace(",", ""));
      }
      tmp.pcr = strArr[i + 1];
      uncheckedData.push({ ...tmp });
    }
    if (strArr[i].indexOf("Total G.W.") > -1) {
      pageInfo.totalNw = parseFloat(
        strArr[i - 1].split(" ")[2].replace(",", ""),
      );
      pageInfo.totalFob = parseFloat(
        strArr[i + 3].split(" ")[1].replace(",", ""),
      );
      pageInfo.totalQty =
        parseInt(strArr[i + 1].split(" ")[0].replace(",", "")) ===
          parseInt(strArr[i + 2].split(" ")[2].replace(",", ""))
          ? parseInt(strArr[i + 1].split(" ")[0].replace(",", ""))
          : parseInt(strArr[i + 1].split(" ")[0].replace(",", "")) +
          parseInt(strArr[i + 2].split(" ")[2].replace(",", ""));
      pageInfo.totalGw = parseFloat(strArr[i].split(" ")[2].replace(",", ""));
    }
  }
  console.log(strArr.join("--"));
  numList.push(uncheckedData.length);
  // Release page resources.
  pdfPage.cleanup();
  return pageInfo;
};
const parseTotalExcel = async (file) => {
  const fileArrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(fileArrayBuffer);
  const firstSheetData = getArrayDataBySheetName(
    workbook,
    workbook.SheetNames[0],
  );
  console.log(firstSheetData);
  const secondSheetData = getArrayDataBySheetName(
    workbook,
    workbook.SheetNames[1],
  );
  console.log(secondSheetData);
  const secondSheetOtherData = getOtherDataBySheetName(
    workbook,
    workbook.SheetNames[1],
  );
  console.log(secondSheetOtherData);
  parseTotalOrderInfo(secondSheetOtherData);
  console.log(totalOrderInfo);
  parseTotalData(firstSheetData, secondSheetData);
  console.log(totalData);
  parseTotalPagesInfo(totalData);
  console.log(totalPagesInfo);
};
const parseTotalPagesInfo = (totalData) => {
  console.log(numList);
  let totalFob = 0;
  let totalNw = 0;
  let totalQty = 0;
  for (let i = 0; i < totalData.length; i++) {
    totalFob += totalData[i].fob;
    totalNw += totalData[i].weight;
    totalQty += totalData[i].quantity;
    if (numList.includes(i + 1)) {
      totalPagesInfo.push({
        totalNw: parseFloat(parseFloat(totalNw).toFixed(2)),
        totalGw: parseFloat(parseFloat(totalNw).toFixed(2)),
        totalFob: parseFloat(parseFloat(totalFob).toFixed(2)),
        totalQty: parseFloat(parseFloat(totalQty).toFixed(2)),
      });
    }
  }
  if (brand.value !== "yifan") {
    for (const item of totalPagesInfo) {
      item.totalGw = parseFloat(parseFloat(totalNw).toFixed(2));
    }
  }
};
const parseTotalOrderInfo = (secondSheetOtherData) => {
  let invNoIndex = 4;
  let invDateIndex = 5;
  let vesselIndex = 12;
  let vesselDateIndex = 11;
  switch (brandName.value) {
    case BRAND_NAME_NA:
      invNoIndex = 3;
      invDateIndex = 4;
      vesselIndex = 11;
      vesselDateIndex = 10;
      break;
    case BRAND_NAME_BY:
    case BRAND_NAME_VR:
      invNoIndex = 3;
      invDateIndex = 4;
      vesselIndex = 10;
      vesselDateIndex = 9;
      break;
    case BRAND_NAME_GP:
      break;
    default:
      break;
  }
  totalOrderInfo.invNo = secondSheetOtherData[invNoIndex][
    secondSheetOtherData[invNoIndex].length - 1
  ]
    .split(":")[1]
    .trim();
  totalOrderInfo.invDate = moment(
    secondSheetOtherData[invDateIndex][
      secondSheetOtherData[invDateIndex].length - 1
    ]
      .split(":")[1]
      .trim(),
    "MMM D YYYY",
  );
  totalOrderInfo.vessel = secondSheetOtherData[vesselIndex][
    secondSheetOtherData[vesselIndex].length - 1
  ]
    .split(":")[1]
    .trim();
  totalOrderInfo.vesselDate = moment(
    secondSheetOtherData[vesselDateIndex][
      secondSheetOtherData[vesselDateIndex].length - 1
    ]
      .split(":")[1]
      .trim(),
    "MMM D YYYY",
  );
  totalOrderInfo.country = "UNITEDSTATESUS";
  totalOrderInfo.destination = "UNITEDSTATESUS";
};

const parseTotalData = (firstSheetData, secondSheetData) => {
  totalData = [];
  let pcrIndex = 1;
  let weightIndex = 9;
  let quantutyIndex = 7;
  let fobIndex = 10;
  console.log(brandName.value);
  switch (brandName.value) {
    case BRAND_NAME_NA:
      pcrIndex = 2;
      fobIndex = 9;
      break;
    case BRAND_NAME_BY:
    case BRAND_NAME_VR:
      fobIndex = 9;
      break;
    case BRAND_NAME_GP:
      break;
    default:
      break;
  }
  for (let i = 0; i < firstSheetData.length; i++) {
    totalData.push({
      fob: parseFloat(parseFloat(firstSheetData[i][fobIndex]).toFixed(2)),
      weight: parseFloat(
        parseFloat(secondSheetData[i][weightIndex]).toFixed(2),
      ),
      pcr:
        firstSheetData[i][pcrIndex] === secondSheetData[i][pcrIndex]
          ? secondSheetData[i][pcrIndex]
          : firstSheetData[i][pcrIndex] + secondSheetData[i][pcrIndex],
      quantity:
        firstSheetData[i][quantutyIndex] === secondSheetData[i][quantutyIndex]
          ? secondSheetData[i][quantutyIndex]
          : firstSheetData[i][quantutyIndex] +
          secondSheetData[i][quantutyIndex],
    });
  }
};
const brandName = ref(BRAND_NAME_GP);
const getArrayDataBySheetName = (workbook, sheetName) => {
  const sheetData = XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
    .filter(
      (item) =>
        BRAND_NAME_LIST.includes(item[2]) || BRAND_NAME_LIST.includes(item[1]),
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
        ),
    )
    .filter((item) => item.length > 0);
};
const handleCheck = () => {
  validate()
    .then(async () => {
      await parseUncheckedPdf(modelRef.uncheckedDataFileList[0].originFileObj);
      await parseTotalExcel(modelRef.totalDataFileList[0].originFileObj);
      checkData();
      checkPagesInfo();
      checkOrderInfo();
    })
    .catch((err) => {
      console.log("error", err);
    });
};
const checkData = () => {
  successData.value = [];
  failedData.value = [];
  for (let i = 0; i < uncheckedData.length; i++) {
    if (isEqualData(uncheckedData[i], totalData[i])) {
      successData.value.push({ ...uncheckedData[i], status: 0 });
    } else {
      console.log(totalData[i]);
      console.log(uncheckedData[i]);
      // failedData.value.push({ ...uncheckedData[i], status: 1 })
      failedData.value.push({
        ...getErrData(uncheckedData[i], totalData[i]),
        status: 1,
      });
    }
  }
};
const checkPagesInfo = () => {
  successPages.value = [];
  failedPages.value = [];
  for (let i = 0; i < uncheckedPagesInfo.length; i++) {
    if (isEqualPage(uncheckedPagesInfo[i], totalPagesInfo[i])) {
      successPages.value.push({ ...uncheckedPagesInfo[i], status: 0 });
    } else {
      console.log(totalPagesInfo[i]);
      console.log(uncheckedPagesInfo[i]);
      failedPages.value.push({ ...uncheckedPagesInfo[i], status: 1 });
    }
  }
};
const checkOrderInfo = () => {
  orderInfoSuccess.value = isEqualOrder(uncheckedOrderInfo, totalOrderInfo);
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
  successPages.value = [];
  failedPages.value = [];
  numList = [];
  uncheckedData = [];
  uncheckedOrderInfo.invNo = "";
  uncheckedOrderInfo.country = "";
  uncheckedOrderInfo.invDate = "";
  uncheckedOrderInfo.destination = "";
  uncheckedOrderInfo.vessel = "";
  uncheckedOrderInfo.vesselDate = "";
  uncheckedPagesInfo = [];
  totalPagesInfo = [];
  totalData = [];
  totalOrderInfo.invNo = "";
  totalOrderInfo.country = "";
  totalOrderInfo.invDate = "";
  totalOrderInfo.destination = "";
  totalOrderInfo.vessel = "";
  totalOrderInfo.vesselDate = "";
};
// 判断价格、重量是否相等
const isEqualData = (a, b) => {
  return (
    a.fob === b.fob &&
    a.weight === b.weight &&
    a.quantity === b.quantity &&
    a.pcr === b.pcr
  );
};
const isEqualPage = (a, b) => {
  return (
    a.totalFob === b.totalFob &&
    a.totalGw === b.totalGw &&
    a.totalQty === b.totalQty &&
    a.totalNw === b.totalNw
  );
};
const isEqualOrder = (a, b) => {
  uncheckedOrderInfo.errList = [];
  let equal = true;
  for (const key in b) {
    if (key === "vesselDate") {
      if (a[key].diff(b[key], "day") < 0) {
        equal = false;
        uncheckedOrderInfo.errList.push(key);
      }
    } else if (key === "invDate") {
      if (b[key].diff(a[key], "day") !== 0) {
        equal = false;
        uncheckedOrderInfo.errList.push(key);
      }
    } else {
      if (a[key] !== b[key]) {
        equal = false;
        uncheckedOrderInfo.errList.push(key);
      }
    }
  }
  return equal;
  // return a.invNo === b.invNo &&
  // a.country === b.country &&
  // a.destination === b.destination &&
  // a.vessel === b.vessel &&
  // a.vesselDate.diff(b.vesselDate, 'day') >= 0 &&
  // b.invDate.diff(a.invDate, 'day') === 0
};
const getErrData = (a, b) => {
  const err = { ...a };
  if (a.fob !== b.fob) {
    err.fob = "pdf：" + a.fob + " -- " + "预报关：" + b.fob;
  }
  if (a.weight !== b.weight) {
    err.weight = "pdf：" + a.weight + " -- " + "预报关：" + b.weight;
  }
  if (a.quantity !== b.quantity) {
    err.pr = "pdf：" + a.pr + " -- " + "预报关：" + b.pr;
  }
  if (a.pcr !== b.pcr) {
    err.pcr = "pdf：" + a.pcr + " -- " + "预报关：" + b.pcr;
  }
  return err;
};
const praseStrEmpty = (str) => {
  if (typeof str === "undefined" || str === null) {
    return "";
  }
  return str;
};
</script>

<style scoped>
.container {
  background: #fff;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
}
</style>
