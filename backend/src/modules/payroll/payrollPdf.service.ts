import puppeteer from 'puppeteer';

/**
 * Format currency value to LKR format with thousand separators
 */
export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date to DD/MM/YYYY format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Generate professional HTML template for payroll run PDF
 * 
 * TEMPLATE STRUCTURE:
 * ===================
 * 1. HEADER: Company name (left) + Document title (right)
 * 2. METADATA TABLE: Run name, status, period, payment date
 * 3. SUMMARY SECTION: 4-column grid with totals (employees, gross, deductions, net)
 * 4. EMPLOYEE PAYSLIPS: One card per employee with:
 *    - Payslip header (employee code + name)
 *    - Employee details table (code, name, department, period)
 *    - Side-by-side tables for Earnings and Deductions
 *    - Net Pay section (highlighted)
 * 
 * PAGE BREAKS:
 * ============
 * - Each employee payslip card uses `page-break-inside: avoid` to prevent splitting
 * - After the first employee, subsequent employees use `page-break-before: always`
 * - This ensures each payslip starts on a new page for readability
 * 
 * CURRENCY FORMATTING:
 * ====================
 * - All amounts use formatCurrency() helper: "LKR 99,750.00"
 * - Currency values are right-aligned in tables
 * - Uses monospace font (Courier New) for better alignment
 * 
 * TO ADD/REMOVE EARNINGS/DEDUCTIONS:
 * ===================================
 * - Earnings and deductions are dynamically generated from the data.employees array
 * - Each employee has earnings[] and deductions[] arrays
 * - To add new types, ensure they're included in the data transformation in the controller
 * - The template will automatically render all items in these arrays
 */
export function generatePayrollRunHTML(data: {
  runName: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  paymentDate: Date | string;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employees: Array<{
    employeeCode: string;
    employeeName: string;
    department?: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    earnings: Array<{ name: string; amount: number }>;
    deductions: Array<{ name: string; amount: number }>;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
  }>;
}): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payroll Run Summary</title>
  <style>
    /* ============================================
       GLOBAL STYLING
       ============================================ */
    @page {
      margin: 20mm 15mm;
      size: A4 portrait;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1f2937;
      background: #ffffff;
    }

    /* ============================================
       UTILITY CLASSES
       ============================================ */
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-muted { color: #6b7280; }
    .font-bold { font-weight: 600; }
    .font-semibold { font-weight: 500; }

    .mb-xs { margin-bottom: 4px; }
    .mb-sm { margin-bottom: 8px; }
    .mb-md { margin-bottom: 12px; }
    .mb-lg { margin-bottom: 16px; }
    .mb-xl { margin-bottom: 24px; }

    .mt-xs { margin-top: 4px; }
    .mt-sm { margin-top: 8px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }

    /* ============================================
       HEADER SECTION
       ============================================ */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .document-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      text-align: right;
    }

    /* ============================================
       FORMAL TABLES
       ============================================ */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }

    .info-table th,
    .info-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    .info-table th {
      font-weight: 500;
      color: #6b7280;
      width: 35%;
      vertical-align: top;
    }

    .info-table td {
      font-weight: 400;
      color: #111827;
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .info-table td.text-left {
      text-align: left;
      font-family: inherit;
    }

    .info-table tr:last-child th,
    .info-table tr:last-child td {
      border-bottom: none;
    }

    .status-badge {
      display: inline-block;
      background: #f3f4f6;
      color: #374151;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 500;
      text-transform: uppercase;
    }

    /* ============================================
       SECTION TITLES
       ============================================ */
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin-top: 20px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #d1d5db;
    }

    /* ============================================
       EMPLOYEE PAYSLIP CARDS
       ============================================ */
    .payslip-card {
      page-break-inside: avoid;
      margin-bottom: 24px;
    }

    .payslip-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
    }

    .payslip-header-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    .payslip-header-subtitle {
      font-size: 10px;
      color: #6b7280;
      margin-top: 2px;
    }

    .payslip-body {
      margin-top: 8px;
    }

    .employee-details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }

    .employee-details-table th,
    .employee-details-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    .employee-details-table th {
      font-weight: 500;
      color: #6b7280;
      width: 35%;
    }

    .employee-details-table td {
      font-weight: 400;
      color: #111827;
    }

    .employee-details-table tr:last-child th,
    .employee-details-table tr:last-child td {
      border-bottom: none;
    }

    /* ============================================
       EARNINGS & DEDUCTIONS TABLES
       ============================================ */
    .tables-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .table-wrapper {
      flex: 1;
    }

    .table-title {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .data-table th {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      padding: 4px 6px;
      text-align: left;
      border: 1px solid #e5e7eb;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table th:last-child {
      text-align: right;
    }

    .data-table td {
      padding: 4px 6px;
      border: 1px solid #e5e7eb;
      color: #111827;
    }

    .data-table td:last-child {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }

    .data-table tbody tr:last-child {
      background: #f9fafb;
      font-weight: 600;
    }

    .data-table tbody tr:last-child td {
      border-top: 2px solid #d1d5db;
    }

    /* ============================================
       NET PAY SECTION
       ============================================ */
    .net-pay-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px solid #111827;
      text-align: right;
    }

    .net-pay-label {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .net-pay-value {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      font-family: 'Courier New', monospace;
    }

    /* ============================================
       PAGE BREAKS
       ============================================ */
    .page-break {
      page-break-before: always;
    }

    @media print {
      .payslip-card {
        page-break-inside: avoid;
      }
      .payslip-card + .payslip-card {
        page-break-before: always;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="company-info">
      <div class="company-name">ZyberHR</div>
    </div>
    <div class="document-title">Payroll Run Summary</div>
  </div>

  <!-- RUN INFO TABLE -->
  <table class="info-table">
    <tr>
      <th>Run Name</th>
      <td class="text-left">${data.runName || 'N/A'}</td>
    </tr>
    <tr>
      <th>Status</th>
      <td class="text-left"><span class="status-badge">${data.status || 'N/A'}</span></td>
    </tr>
    <tr>
      <th>Period</th>
      <td class="text-left">${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}</td>
    </tr>
    <tr>
      <th>Payment Date</th>
      <td class="text-left">${formatDate(data.paymentDate)}</td>
    </tr>
  </table>

  <!-- SUMMARY TABLE -->
  <div class="section-title">Summary</div>
  <table class="info-table">
    <tr>
      <th>Total Employees</th>
      <td>${data.employeeCount || 0}</td>
    </tr>
    <tr>
      <th>Total Gross</th>
      <td>${formatCurrency(data.totalGross || 0)}</td>
    </tr>
    <tr>
      <th>Total Deductions</th>
      <td>${formatCurrency(data.totalDeductions || 0)}</td>
    </tr>
    <tr>
      <th>Total Net</th>
      <td>${formatCurrency(data.totalNet || 0)}</td>
    </tr>
  </table>

  <!-- EMPLOYEE PAYSLIPS -->
  <div class="section-title">Employee Payslips</div>
  ${data.employees.map((emp, index) => `
    <div class="payslip-card ${index > 0 ? 'page-break' : ''}">
      <!-- Payslip Header -->
      <div class="payslip-header">
        <div class="payslip-header-title">Employee Payslip</div>
        <div class="payslip-header-subtitle">${emp.employeeCode} – ${emp.employeeName}</div>
      </div>

      <!-- Payslip Body -->
      <div class="payslip-body">
        <!-- Employee Details -->
        <table class="employee-details-table">
          <tr>
            <th>Employee Code</th>
            <td>${emp.employeeCode}</td>
          </tr>
          <tr>
            <th>Employee Name</th>
            <td>${emp.employeeName}</td>
          </tr>
          <tr>
            <th>Department</th>
            <td>${emp.department || 'N/A'}</td>
          </tr>
          <tr>
            <th>Period</th>
            <td>${formatDate(emp.periodStart)} – ${formatDate(emp.periodEnd)}</td>
          </tr>
        </table>

        <!-- Earnings & Deductions Tables -->
        <div class="tables-container">
          <!-- Earnings Table -->
          <div class="table-wrapper">
            <div class="table-title">Earnings</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${emp.earnings.length > 0 
                  ? emp.earnings.map(earning => `
                      <tr>
                        <td>${earning.name}</td>
                        <td>${formatCurrency(earning.amount)}</td>
                      </tr>
                    `).join('')
                  : '<tr><td colspan="2" class="text-muted">No earnings items</td></tr>'
                }
                <tr>
                  <td class="font-bold">Gross Pay</td>
                  <td class="font-bold">${formatCurrency(emp.grossPay)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Deductions Table -->
          <div class="table-wrapper">
            <div class="table-title">Deductions</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${emp.deductions.length > 0
                  ? emp.deductions.map(deduction => `
                      <tr>
                        <td>${deduction.name}</td>
                        <td>${formatCurrency(deduction.amount)}</td>
                      </tr>
                    `).join('')
                  : '<tr><td colspan="2" class="text-muted">No deductions</td></tr>'
                }
                <tr>
                  <td class="font-bold">Total Deductions</td>
                  <td class="font-bold">${formatCurrency(emp.totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Pay -->
        <div class="net-pay-section">
          <div class="net-pay-label">Net Pay</div>
          <div class="net-pay-value">${formatCurrency(emp.netPay)}</div>
        </div>
      </div>
    </div>
  `).join('')}
</body>
</html>
  `;

  return html;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
export async function generatePayrollRunPDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
