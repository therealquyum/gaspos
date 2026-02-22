let sellingPricePerKg = 1000;
let costPricePerKg = 900;
const STORAGE_KEY = "gasSalesData";

window.onload = function() {
    // Load saved prices
    const savedSelling = localStorage.getItem("sellingPrice");
    const savedCost = localStorage.getItem("costPrice");
    if (savedSelling) sellingPricePerKg = parseFloat(savedSelling);
    if (savedCost) costPricePerKg = parseFloat(savedCost);

    document.getElementById("sellingPrice").value = sellingPricePerKg;
    document.getElementById("costPrice").value = costPricePerKg;

    // Load saved input mode
    const savedMode = localStorage.getItem("inputMode");
    if (savedMode) document.getElementById("inputMode").value = savedMode;

    getTodayRecord();
    updateDisplay();
    switchInputMode();
};

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

function loadData() {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data ? data : {};
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateSellingPrice() {
    const val = parseFloat(document.getElementById("sellingPrice").value);
    if (!isNaN(val)) {
        sellingPricePerKg = val;
        localStorage.setItem("sellingPrice", val);
        calculateValue();
    }
}

function updateCostPrice() {
    const val = parseFloat(document.getElementById("costPrice").value);
    if (!isNaN(val)) {
        costPricePerKg = val;
        localStorage.setItem("costPrice", val);
    }
}

function getTodayRecord() {
    const today = getTodayDate();
    let data = loadData();
    if (!data[today]) {
        data[today] = { totalKg:0, totalAmount:0, totalProfit:0, sales:[] };
        saveData(data);
    }
    return data[today];
}

function updateDisplay() {
    const today = getTodayDate();
    const record = loadData()[today];
    document.getElementById("todayDate").innerText = "Date: " + today;
    document.getElementById("totalKg").innerText = record.totalKg.toFixed(2);
    document.getElementById("totalAmount").innerText = record.totalAmount.toFixed(2);
    document.getElementById("totalProfit").innerText = record.totalProfit.toFixed(2);
    document.getElementById("totalTransactions").innerText = record.sales.length;
}

function switchInputMode() {
    const mode = document.getElementById("inputMode").value;
    const inputField = document.getElementById("singleInput");
    localStorage.setItem("inputMode", mode);
    inputField.placeholder = mode === "money" ? "Enter Amount (₦)" : "Enter KG";
    document.getElementById("calculatedResult").innerText = "";
}

function calculateValue() {
    const mode = document.getElementById("inputMode").value;
    const val = parseFloat(document.getElementById("singleInput").value);
    const result = document.getElementById("calculatedResult");

    if (isNaN(val) || val <= 0) { result.innerText = ""; return; }

    if (mode === "money") {
        const kg = val / sellingPricePerKg;
        result.innerText = "Stop at: " + kg.toFixed(2) + " KG";
    } else {
        const amount = val * sellingPricePerKg;
        result.innerText = "Customer should pay: ₦" + amount.toFixed(2);
    }
}

function sellGas() {
    if (!confirm("Confirm: Do you really want to register this sale?")) return;

    const mode = document.getElementById("inputMode").value;
    const val = parseFloat(document.getElementById("singleInput").value);
    if (isNaN(val) || val <= 0) { alert("Enter valid Amount or KG"); return; }

    let kg = mode === "money" ? val / sellingPricePerKg : val;
    let amount = kg * sellingPricePerKg;
    const profit = kg * (sellingPricePerKg - costPricePerKg);

    const today = getTodayDate();
    let data = loadData();
    let record = getTodayRecord();

    record.totalKg += kg;
    record.totalAmount += amount;
    record.totalProfit += profit;
    record.sales.push({ kg, amount, profit, time: new Date().toLocaleTimeString() });

    data[today] = record;
    saveData(data);

    document.getElementById("singleInput").value = "";
    document.getElementById("calculatedResult").innerText = "";
    updateDisplay();
}

// Undo Last Sale
function undoLastSale() {
    if (!confirm("Confirm: Do you really want to undo the last sale?")) return;
    const today = getTodayDate();
    let data = loadData();
    let record = data[today];
    if (!record || record.sales.length === 0) { alert("No sale to undo"); return; }

    const lastSale = record.sales.pop();
    record.totalKg -= lastSale.kg;
    record.totalAmount -= lastSale.amount;
    record.totalProfit -= lastSale.profit;

    saveData(data);
    updateDisplay();
}

// Start New Day
function startNewDay() {
    if (!confirm("Confirm: Start a new business day?")) return;
    const today = getTodayDate();
    let data = loadData();
    data[today] = { totalKg:0, totalAmount:0, totalProfit:0, sales:[] };
    saveData(data);
    updateDisplay();
}

// View History with newest first + per-day totals + grand totals
function viewHistory() {
    const historyPanel = document.getElementById("historyPanel");
    const historyContent = document.getElementById("historyContent");
    const data = loadData();
    historyContent.innerHTML = "";

    // 1️⃣ Grand totals across all days
    let grandTotalKg = 0, grandTotalAmount = 0, grandTotalProfit = 0;
    Object.values(data).forEach(record => {
        grandTotalKg += record.totalKg;
        grandTotalAmount += record.totalAmount;
        grandTotalProfit += record.totalProfit;
    });

    historyContent.innerHTML = `
        <div class="history-box" style="background:rgba(0,0,0,0.5);">
            <strong>Grand Total Across All Days</strong>
            <p>Total KG Sold: ${grandTotalKg.toFixed(2)}</p>
            <p>Total Amount: ₦${grandTotalAmount.toFixed(2)}</p>
            <p>Total Profit: ₦${grandTotalProfit.toFixed(2)}</p>
        </div>
    `;

    // 2️⃣ Sort days newest first
    const sortedDates = Object.keys(data).sort((a, b) => b.localeCompare(a));
    sortedDates.forEach(date => {
        const record = data[date];
        const box = document.createElement("div");
        box.className = "history-box";

        // Individual sales
        let salesHTML = "";
        for (let i = record.sales.length - 1; i >= 0; i--) {
            const sale = record.sales[i];
            salesHTML += `
            <div class="sale-entry">
                <span>${sale.time} - ${sale.kg.toFixed(2)}kg | ₦${sale.amount.toFixed(2)} | Profit: ₦${sale.profit.toFixed(2)}</span>
                <button class="danger" onclick="deleteSale('${date}', ${i})">Delete</button>
            </div>`;
        }

        // Totals per day
        box.innerHTML = `
            <strong>${date}</strong>
            <p><b>Total KG:</b> ${record.totalKg.toFixed(2)}</p>
            <p><b>Total Amount:</b> ₦${record.totalAmount.toFixed(2)}</p>
            <p><b>Total Profit:</b> ₦${record.totalProfit.toFixed(2)}</p>
            <p><b>Total Transactions:</b> ${record.sales.length}</p>
            <hr>${salesHTML}
        `;

        historyContent.appendChild(box);
    });

    historyPanel.style.display = "block";
}

// Delete Single Sale
function deleteSale(date, index) {
    if (!confirm("Confirm: Delete this sale?")) return;
    let data = loadData();
    const record = data[date];
    const sale = record.sales[index];

    record.totalKg -= sale.kg;
    record.totalAmount -= sale.amount;
    record.totalProfit -= sale.profit;

    record.sales.splice(index, 1);
    data[date] = record;
    saveData(data);
    viewHistory();
    updateDisplay();
}

// Close History
function closeHistory() {
    document.getElementById("historyPanel").style.display = "none";
}

// Export today's sales to CSV
function exportToExcel() {
    if (!confirm("Export today's sales to Excel?")) return;
    const today = getTodayDate();
    const record = loadData()[today];
    if (!record || record.sales.length === 0) { alert("No sales to export"); return; }

    let csv = "Time,KG,Amount,Profit\n";
    record.sales.forEach(sale => {
        csv += `${sale.time},${sale.kg.toFixed(2)},${sale.amount.toFixed(2)},${sale.profit.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `GasSales_${today}.csv`;
    link.click();
}