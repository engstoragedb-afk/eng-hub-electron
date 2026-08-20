import ExcelJS from 'exceljs';

export interface ExportExcelOptions {
  filteredData: any[];
  visibleFixedCols: { id: string; name: string }[];
  visibleAplColumns: { id: string; name: string }[];
  categories: { id: string; name: string; count?: number }[];
  activeCategoryId: string;
}

export const exportServisToExcel = async ({
  filteredData,
  visibleFixedCols,
  visibleAplColumns,
  categories,
  activeCategoryId
}: ExportExcelOptions) => {
  if (filteredData.length === 0) return;

  const headers = [
    ...visibleFixedCols.map(col => col.name),
    ...visibleAplColumns.map(col => col.name),
  ];

  const rows = filteredData.map((u, index) => {
    const row: any = {};

    visibleFixedCols.forEach(col => {
      if (col.id === 'no') {
        row[col.name] = index + 1;
      } else if (col.id === 'code') {
        row[col.name] = u.code || '';
      } else if (col.id === 'operator') {
        row[col.name] = u.operator?.full_name || u.operator?.name || '';
      } else if (col.id === 'lokasi') {
        row[col.name] = u.location?.name || (typeof u.location === 'string' ? u.location : '');
      } else if (col.id === 'hm') {
        row[col.name] = u.hm || 0;
      } else if (col.id === 'hours') {
        row[col.name] = u.hours || 0;
      }
    });

    visibleAplColumns.forEach(col => {
      const aplRecord = u.aplData?.find((a: any) => a.category_apl_id === col.id);
      row[col.name] = aplRecord ? (aplRecord.input ?? 0) : 0;
    });

    return row;
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ENG HUB';
  workbook.lastModifiedBy = 'ENG HUB';
  workbook.created = new Date();
  workbook.modified = new Date();

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const categoryName = activeCategory ? activeCategory.name.replace(/\s+/g, '_') : 'Semua';

  const worksheet = workbook.addWorksheet(categoryName.slice(0, 31));

  worksheet.columns = headers.map(header => ({
    header,
    key: header,
    width: Math.max(header.length + 4, 14),
  }));

  rows.forEach(row => {
    worksheet.addRow(row);
  });
  
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;

  headerRow.eachCell(cell => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAF7' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF808080' } },
      bottom: { style: 'thin', color: { argb: 'FF808080' } },
      left: { style: 'thin', color: { argb: 'FF808080' } },
      right: { style: 'thin', color: { argb: 'FF808080' } },
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.height = 22;
    row.eachCell(cell => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });
  });

  headers.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1);
    if (visibleFixedCols[index]?.id === 'no') {
      column.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    const fixedColumn = visibleFixedCols.find(col => col.name === header);
    if (fixedColumn?.id === 'hm' || fixedColumn?.id === 'hours' || visibleAplColumns.some(col => col.name === header)) {
      column.alignment = { horizontal: 'center', vertical: 'middle' };
      column.numFmt = '#,##0.00';
    }
  });

  for (let i = 1; i <= worksheet.columnCount; i++) {
    const column = worksheet.getColumn(i);
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const value = cell.value;
      let length = 0;
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          length = JSON.stringify(value).length;
        } else {
          length = String(value).length;
        }
      }
      maxLength = Math.max(maxLength, length);
    });
    column.width = Math.min(Math.max(maxLength + 4, 14), 40);
  }

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: 'A1',
    to: `${worksheet.getColumn(worksheet.columnCount).letter}1`,
  };
  
  const date = new Date().toISOString().split('T')[0];
  const fileName = `Data_Servis_${categoryName}_${date}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
