const apiUrl = 'https://6509e208f6553137159c30bf.mockapi.io/Registros';

let myForm = document.querySelector("form");
let myTable = document.querySelector("#myData");
let deleteButton = document.getElementById("deleteButton");
let modifyButton = document.getElementById("modifyButton");
let searchButton = document.getElementById("searchButton");
let searchIdInput = document.getElementById("searchId");
let counter = 1;
let total = 0;
let totalIngresos = 0;
let totalEgresos = 0;
let storedData = JSON.parse(localStorage.getItem('tableData')) || [];

for (let i = 0; i < storedData.length; i++) {
    insertRow(storedData[i]);
    counter++;
}

document.addEventListener("DOMContentLoaded", () => {
    updateTotal();
    updateTotalIngresos();
    updateTotalEgresos();

    myForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        insertRow(formData);
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        saveDataToLocalStorage();

        // Envía los datos a la API al crear un registro
        sendDataToAPI('POST', formData);
    });

    myTable.addEventListener('change', () => {
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        updateButtons();
        saveDataToLocalStorage();
    });

    deleteButton.addEventListener('click', () => {
        let checkboxes = document.querySelectorAll('.select-row:checked');
        let dataToDelete = Array.from(checkboxes).map(checkbox => {
            return checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
        });

        // Elimina los datos en la API
        sendDataToAPI('DELETE', dataToDelete);

        checkboxes.forEach(checkbox => {
            let row = checkbox.closest('tr');
            myTable.removeChild(row);
        });
        counter -= checkboxes.length;
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        updateButtons();
        saveDataToLocalStorage();
    });

    modifyButton.addEventListener('click', () => {
        let checkboxes = document.querySelectorAll('.select-row:checked');
        let dataToModify = Array.from(checkboxes).map(checkbox => {
            const id = checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
            const newValue = prompt("Ingrese el nuevo monto para la fila #" + id + ":");
            return { id, valor: parseFloat(newValue).toFixed(2) };
        });

        // Modifica los datos en la API
        sendDataToAPI('PUT', dataToModify);

        checkboxes.forEach(checkbox => {
            let row = checkbox.closest('tr');
            let newValue = prompt("Ingrese el nuevo monto para la fila #" + row.cells[1].innerText + ":");
            if (newValue !== null && !isNaN(newValue) && parseFloat(newValue) >= 0) {
                row.cells[2].textContent = parseFloat(newValue).toFixed(2);
            }
        });
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        saveDataToLocalStorage();
    });

    searchButton.addEventListener('click', () => {
        const searchId = parseInt(searchIdInput.value);
        const row = findRowById(searchId);
        if (row) {
            const valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
            const tipo = row.querySelector('td:nth-child(4)').textContent;
            alert(`ID: ${searchId}\nMonto (Valor): $${valor.toFixed(2)}\nTipo: ${tipo}`);
        } else {
            alert(`No se encontró ninguna fila con el ID ${searchId}`);
        }
    });
});

function insertRow(formData) {
    let row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="checkbox" class="select-row"></td>
        <td>${counter}</td>
        <td>${formData.valor}</td>
        <td>${formData.caja}</td>
    `;
    myTable.appendChild(row);
    counter++;
}

function updateTotal() {
    total = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'ingreso') {
            total += valor;
        } else if (tipo === 'egreso') {
            total -= valor;
        }
    }

    const totalAmountElement = document.getElementById('totalAmount');
    totalAmountElement.textContent = `Total: $${total.toFixed(2)}`;
}

function updateTotalIngresos() {
    totalIngresos = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'ingreso') {
            totalIngresos += valor;
        }
    }

    const totalIngresosElement = document.getElementById('totalIngresos');
    totalIngresosElement.textContent = `Total de Ingresos: $${totalIngresos.toFixed(2)}`;
}

function updateTotalEgresos() {
    totalEgresos = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'egreso') {
            totalEgresos += valor;
        }
    }

    const totalEgresosElement = document.getElementById('totalEgresos');
    totalEgresosElement.textContent = `Total de Egresos: $${totalEgresos.toFixed(2)}`;
}

function saveDataToLocalStorage() {
    let dataToSave = [];
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;
        dataToSave.push({ valor, caja: tipo });
    }
    localStorage.setItem('tableData', JSON.stringify(dataToSave));
}

function updateButtons() {
    let checkboxes = document.querySelectorAll('.select-row:checked');
    if (checkboxes.length > 0) {
        deleteButton.disabled = false;
        modifyButton.disabled = false;
    } else {
        deleteButton.disabled = true;
        modifyButton.disabled = true;
    }
}

function findRowById(id) {
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let rowId = parseInt(rows[i].querySelector('td:nth-child(2)').textContent);
        if (rowId === id) {
            return rows[i];
        }
    }
    return null;
}

function sendDataToAPI(method, data) {
    let url = apiUrl;
    let requestMethod = method;

    if (method === 'PUT' || method === 'DELETE') {
        url += `/${data.id}`;
    }

    fetch(url, {
        method: requestMethod,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Data sent to API:', data);
    })
    .catch(error => {
        console.error('Error sending data to API:', error);
    });
}
