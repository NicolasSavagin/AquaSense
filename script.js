let speciesDB = [];

// Carrega o banco de dados de espécies
async function loadSpeciesDB() {
    try {
        const response = await fetch('species.json'); // Caminho para o seu arquivo JSON
        speciesDB = await response.json();
    } catch (error) {
        console.error("Erro ao carregar o banco de dados de espécies:", error);
    }
}

let currentChart = null; // Variável para armazenar o gráfico atual

// Função para abrir o gráfico de pH
function openPHGraphModal(aquariumIndex) {
    const modal = document.getElementById('phGraphModal');
    modal.style.display = "block"; // Exibe o modal

    // Atualiza o gráfico para as últimas 24 horas por padrão
    updateGraphData(aquariumIndex, 1); // Passa o aquariumIndex para updateGraphData
}
// Função para atualizar os dados do gráfico
function updateGraphData(aquariumIndex, days = 1) {
    const aquarium = aquariums[aquariumIndex];
    const canvas = document.getElementById('phGraphCanvas');
    const ctx = canvas.getContext('2d');

    // Atualiza o título do modal com base no intervalo de tempo
    const modalTitle = document.querySelector('#phGraphModal h2');
    let title = "Gráfico de pH - Últimas 24 Horas";
    
    switch (days) {
        case 3:
            title = "Gráfico de pH - Últimos 3 Dias";
            break;
        case 7:
            title = "Gráfico de pH - Últimos 7 Dias";
            break;
        case 14:
            title = "Gráfico de pH - Últimos 14 Dias";
            break;
        case 30:
            title = "Gráfico de pH - Últimos 30 Dias";
            break;
    }

    // Atualiza o título no modal
    modalTitle.textContent = title;

    // Gerar dados simulados de pH com base no intervalo de tempo selecionado
    const timeLabels = [];
    const phData = [];
    const currentTime = new Date(); // Hora atual
    const timeSpan = days * 24; // Convertendo dias para horas

    for (let i = 0; i < timeSpan; i++) {
        const hour = new Date(currentTime);
        hour.setHours(currentTime.getHours() - (timeSpan - i)); // Definindo as horas de acordo com o intervalo
        timeLabels.push(hour.toLocaleDateString() + ' ' + hour.toLocaleTimeString()); // Formata a data e hora

        // Simula uma leitura de pH, fazendo uma variação em torno do valor do pH do aquário
        const fluctuation = Math.random() * 0.5 - 0.25; // Flutuação do pH entre -0.25 e +0.25
        phData.push(aquarium.currentPH + fluctuation); // Simulação de flutuação do pH
    }

    // Se já houver um gráfico anterior, destruímos ele para recriar com novos dados
    if (currentChart) {
        currentChart.destroy();
    }

    // Configuração do gráfico
    currentChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: timeLabels, // Horários
            datasets: [{
                label: 'pH do Aquário',
                data: phData,
                borderColor: 'rgba(255, 99, 132, 1)', // Cor da linha do gráfico
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { 
                        maxRotation: 45, 
                        minRotation: 45 
                    }
                },
                y: {
                    min: 6, // pH mínimo
                    max: 8, // pH máximo
                    ticks: {
                        stepSize: 0.1
                    }
                }
            }
        }
    });
}

// Chama a função de carregamento ao iniciar
loadSpeciesDB().then(() => {
    renderAquariums(); // Renderiza os aquários após carregar o banco de dados
    simulatePHReadings(); // Inicia as leituras de pH simuladas
});
// Função para abrir o modal de imagem
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc; // Define a imagem do modal
    modal.style.display = "block"; // Exibe o modal
}
let aquariums = [];

// Função para criar um aquário
function createAquarium() {
    const name = document.getElementById('aquariumNameInput').value;
    const volume = document.getElementById('aquariumVolumeInput').value;

    if (!name || !volume) {
        showCompatibilityModal("Por favor, insira o nome e a litragem do aquário.");
        return;
    }

    aquariums.push({
        name,
        volume: parseFloat(volume),
        species: [],
        currentPH: 7,
        phReadings: [], // Armazena as leituras de pH
        speciesVisible: false
    });

    renderAquariums();
    document.getElementById('aquariumNameInput').value = ''; // Limpa o campo de nome
    document.getElementById('aquariumVolumeInput').value = ''; // Limpa o campo de litragem
}

// Função para renderizar aquários
function renderAquariums() {
    const container = document.getElementById('aquariumContainer');
    container.innerHTML = '';
    
    aquariums.forEach((aquarium, index) => {
        const aquariumDiv = document.createElement('div');
        aquariumDiv.className = 'aquarium';
        
        // Calcula o estado do aquário (pH e quantidade de peixes)
        const { color, message } = checkAquariumStatus(aquarium, index);
        
        // Aplica a cor ao aquário com base no estado
        aquariumDiv.style.backgroundColor = color;
        
        // Cabeçalho do aquário
        const header = document.createElement('div');
        header.className = 'aquarium-header';
        header.onclick = () => toggleSpeciesVisibility(index);
        
        const title = document.createElement('h2');
        title.textContent = `${aquarium.name} - ${aquarium.volume}L (pH: ${aquarium.currentPH})`;
        
        // Botão de abrir gráfico
        const graphBtn = document.createElement('span');
        graphBtn.className = 'graph-icon';
        graphBtn.textContent = '📊';
        graphBtn.onclick = (e) => { 
            e.stopPropagation(); 
            openPHGraphModal(index); // Passa o índice do aquário
        };

        // Botão de adicionar espécie
        const addBtn = document.createElement('span');
        addBtn.className = 'add-icon';
        addBtn.textContent = '+';
        addBtn.onclick = (e) => { e.stopPropagation(); openSpeciesModal(index); };
        
        // Botão de deletar aquário
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-icon';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteAquarium(index); };
        
        header.appendChild(title);
        header.appendChild(graphBtn); // Botão de gráfico
        header.appendChild(addBtn);
        header.appendChild(deleteBtn);
        
        // Exibe a mensagem de erro, se houver
        if (message) {
            const warningMessage = document.createElement('p');
            warningMessage.textContent = message;
            aquariumDiv.appendChild(warningMessage);
        }

        // Lista de espécies
        const speciesList = document.createElement('ul');
        speciesList.className = 'species-list';
        speciesList.style.display = aquarium.speciesVisible ? 'block' : 'none';

        aquarium.species.forEach((species, speciesIndex) => {
            const speciesItem = document.createElement('li');
            speciesItem.className = 'species-item';
            speciesItem.innerHTML = ` 
                <img src="${species.image}" class="species-image" alt="${species.name}" onclick="openImageModal('${species.image}')">
                <strong>${species.name}</strong> - Quantidade: 
                <input type="number" min="1" value="${species.quantity}" onchange="updateQuantity(${index}, ${speciesIndex}, this.value)">
                <br>PH Ideal: ${species.idealPH}<br>Descrição: ${species.description}<br>Comportamento: ${species.behavior}`;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'delete-icon';
            removeBtn.textContent = '🗑️';
            removeBtn.onclick = () => removeSpecies(index, speciesIndex);

            speciesItem.appendChild(removeBtn);
            speciesList.appendChild(speciesItem);
        });
        
        aquariumDiv.appendChild(header);
        aquariumDiv.appendChild(speciesList);
        container.appendChild(aquariumDiv);
    });
}
// Função para alternar a visibilidade das espécies
function toggleSpeciesVisibility(index) {
    aquariums[index].speciesVisible = !aquariums[index].speciesVisible; // Altera o estado de visibilidade
    renderAquariums(); // Atualiza a renderização
}

// Função para exibir o modal de compatibilidade
function showCompatibilityModal(message) {
    const modal = document.getElementById("compatibilityModal");
    const compatibilityMessageContainer = modal.querySelector(".modal-compatibility");
    compatibilityMessageContainer.innerHTML =`
        <span class="close" onclick="closeModal('compatibilityModal')">&times;</span>
        <h2>Aviso</h2>
        <p>${message}</p>
    `;
    modal.style.display = "block"; // Exibe o modal de compatibilidade
}

// Função para fechar o modal
function closeModal() {
    const modal = document.getElementById("compatibilityModal");
    modal.querySelector(".modal-compatibility").innerHTML = '<span class="close" onclick="closeModal()">&times;</span>';
    modal.style.display = "none";
}

// Função para verificar compatibilidade e adicionar ou atualizar espécies
function addOrUpdateSpecies(aquariumIndex, species) {
    const aquarium = aquariums[aquariumIndex];
    const incompatibleSpecies = aquarium.species.filter(s => s.name !== species.name && !s.compatibility.includes(species.name));

    if (incompatibleSpecies.length > 0) {
        const names = incompatibleSpecies.map(s => s.name).join(", ");
        const message = `A espécie ${species.name} é incompatível com ${names} já presentes no aquário.`;
        showCompatibilityModal(message);
        return;
    }

    // Atualiza a quantidade se a espécie já existe ou adiciona uma nova espécie
    const existingSpecies = aquarium.species.find(s => s.name === species.name);
    if (existingSpecies) {
        existingSpecies.quantity++;
    } else {
        aquarium.species.push({ ...species, quantity: 1 });
    }

    // Garante que a lista de espécies do aquário fique visível após a adição
    aquarium.speciesVisible = true;

    renderAquariums();
}


// Função para remover uma espécie
function removeSpecies(aquariumIndex, speciesIndex) {
    aquariums[aquariumIndex].species.splice(speciesIndex, 1); // Remove a espécie
    renderAquariums(); // Atualiza a renderização
}

// Função para atualizar a quantidade de espécies
function updateQuantity(aquariumIndex, speciesIndex, quantity) {
    const newQuantity = Math.max(1, quantity); // Garantir que a quantidade seja pelo menos 1
    if (newQuantity !== aquariums[aquariumIndex].species[speciesIndex].quantity) {
        aquariums[aquariumIndex].species[speciesIndex].quantity = newQuantity; // Atualiza a quantidade
        renderAquariums(); // Atualiza a renderização
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        
        // Limpa o conteúdo do aviso de compatibilidade
        if (modalId === "compatibilityModal") {
            const compatibilityMessageContainer = modal.querySelector(".modal-compatibility");
            compatibilityMessageContainer.innerHTML = '<span class="close" onclick="closeModal(\'compatibilityModal\')">&times;</span>';
        }
    }
}

// Evento para fechar o modal ao clicar fora dele
window.onclick = function(event) {
    const modals = ['speciesModal', 'imageModal', 'compatibilityModal'];
    
    modals.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            closeModal(modalId); 
        }
    });
}


// Evento para fechar o modal ao pressionar a tecla 'Esc'
window.onkeydown = function(event) {
    if (event.key === "Escape") { // Verifica se a tecla pressionada é 'Esc'
        closeModal(); // Fecha os modais
    }
};

// Uso nas funções de abertura do modal e adição de espécies
function openSpeciesModal(aquariumIndex) {
    const modal = document.getElementById('speciesModal');
    const speciesList = document.getElementById('speciesList');
    speciesList.innerHTML = '';

    speciesDB.forEach(species => {
        const speciesItem = document.createElement('div');
        speciesItem.className = 'species-item';
        speciesItem.innerHTML = `<img src="${species.image}" class="species-image" alt="${species.name}"> <strong>${species.name}</strong> - ${species.description}`;
        
        const addButton = document.createElement('button');
        addButton.textContent = "Adicionar";
        addButton.onclick = () => {
            addOrUpdateSpecies(aquariumIndex, species); // Chama a função de adição ou atualização
            closeModal(); // Fecha o modal após adicionar
        };

        speciesItem.appendChild(addButton);
        speciesList.appendChild(speciesItem);
    });

    modal.style.display = "block";
}


// Função para excluir um aquário
function deleteAquarium(index) {
    aquariums.splice(index, 1); // Remove o aquário
    renderAquariums(); // Atualiza a renderização
}

// Função para verificar o estado do aquário (pH e número de peixes)
function checkAquariumStatus(aquarium, index) {
    let color = "white"; // Cor inicial do aquário
    let textColor = "black"; // Cor inicial do texto
    let messages = []; // Armazena todas as mensagens de erro

    // Verificação do pH
    aquarium.species.forEach(species => {
        if (aquarium.currentPH < species.idealPH - 1 || aquarium.currentPH > species.idealPH + 1) {
            color = color === "white" ? "yellow" : color; // Amarelo se pH fora do ideal
            messages.push(" pH fora do ideal.");
        }
    });

    // Verificação da quantidade máxima de peixes
    let totalFish = 0;
    aquarium.species.forEach(species => {
        totalFish += species.quantity;
    });
    
    if (totalFish > aquarium.volume * 2) { // Supondo que cada litro possa ter até 2 peixes (ajuste conforme sua lógica)
        color = color === "white" ? "red" : color; // Vermelho se ultrapassar o limite de peixes
        messages.push(" quantidade de peixes excede o limite.");
    }

    // Se tanto o pH quanto a quantidade de peixes estiverem errados, a cor será preta
    if (color === "yellow" && totalFish > aquarium.volume * 2) {
        color = "red"; // Preto se ambos estiverem errados
        messages.push("Erro: pH e/ou quantidade de peixes fora dos limites!");
    }

    // Se houver mensagens, exibe o modal de compatibilidade com essas mensagens
    if (messages.length > 0) {
        showCompatibilityModal(messages.join(" "), textColor); // Passa a cor do texto para o modal
    }

    // Junta todas as mensagens de erro em uma só
    const message = messages.join(" ");

    // Retorna a cor do aquário, a cor do texto e a mensagem
    return { color, textColor, message };
}


