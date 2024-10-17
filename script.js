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

// Chama a função de carregamento ao iniciar
loadSpeciesDB().then(() => {
    renderAquariums(); // Renderiza aquários após carregar o banco de dados
});

let aquariums = [];

// Função para criar um aquário
function createAquarium() {
    const name = document.getElementById('aquariumNameInput').value;
    if (name) {
        aquariums.push({ name, species: [], currentPH: (Math.random() * (8 - 6) + 6).toFixed(1), speciesVisible: false }); // Adicionado estado para visibilidade
        renderAquariums();
        document.getElementById('aquariumNameInput').value = ''; // Limpar o campo
    }
}

// Função para abrir o modal de imagem
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc; // Define a imagem do modal
    modal.style.display = "block"; // Exibe o modal
}

// Função para renderizar aquários
function renderAquariums() {
    const container = document.getElementById('aquariumContainer');
    container.innerHTML = '';
    
    aquariums.forEach((aquarium, index) => {
        const aquariumDiv = document.createElement('div');
        aquariumDiv.className = 'aquarium';
        
        // Cabeçalho do aquário
        const header = document.createElement('div');
        header.className = 'aquarium-header';
        header.onclick = () => toggleSpeciesVisibility(index); // Adiciona evento de clique para esconder/mostrar espécies
        
        const title = document.createElement('h2');
        title.textContent = aquarium.name + ` (pH: ${aquarium.currentPH})`;
        
        const addBtn = document.createElement('span');
        addBtn.className = 'add-icon';
        addBtn.textContent = '+';
        addBtn.onclick = (e) => { e.stopPropagation(); openSpeciesModal(index); }; // Impede o clique no cabeçalho
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-icon';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteAquarium(index); }; // Impede o clique no cabeçalho
        
        header.appendChild(title);
        header.appendChild(addBtn);
        header.appendChild(deleteBtn);
        
        // Lista de espécies
        const speciesList = document.createElement('ul');
        speciesList.className = 'species-list';
        speciesList.style.display = aquarium.speciesVisible ? 'block' : 'none'; // Controle de visibilidade

        aquarium.species.forEach((species, speciesIndex) => {
            const speciesItem = document.createElement('li');
            speciesItem.className = 'species-item';
            speciesItem.innerHTML = `<img src="${species.image}" class="species-image" alt="${species.name}" onclick="openImageModal('${species.image}')"> 
                                     <strong>${species.name}</strong> - Quantidade: <input type="number" min="1" value="${species.quantity}" onchange="updateQuantity(${index}, ${speciesIndex}, this.value)"> 
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

// Função para abrir o modal de seleção de espécies
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
        addButton.onclick = () => addSpecies(aquariumIndex, species);
        speciesItem.appendChild(addButton);
        speciesList.appendChild(speciesItem);
    });

    modal.style.display = "block";
}

// Função para exibir o modal de compatibilidade
function showCompatibilityModal(message) {
    const modal = document.getElementById("compatibilityModal");
    const compatibilityMessageContainer = modal.querySelector(".modal-compatibility");
    // Limpa mensagens anteriores e adiciona a nova mensagem
    compatibilityMessageContainer.innerHTML =`
        <span class="close" onclick="closeModal('compatibilityModal')">&times;</span>
        <h2>Aviso de Compatibilidade</h2>
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

    // Verifica se há espécies incompatíveis já presentes
    const incompatibleSpecies = aquarium.species.filter(s => s.name !== species.name && !s.compatibility.includes(species.name));

    if (incompatibleSpecies.length > 0) {
        const names = incompatibleSpecies.map(s => s.name).join(", ");
        const message = `A espécie ${species.name} é incompatível com ${names} já presentes no aquário.`;
        showCompatibilityModal(message); // Exibe o aviso de incompatibilidade
        return;
    }

    // Verifica se a espécie já está presente para atualizar a quantidade
    const existingSpecies = aquarium.species.find(s => s.name === species.name);
    if (existingSpecies) {
        existingSpecies.quantity++; // Aumenta a quantidade se a espécie já existir no aquário
    } else {
        aquarium.species.push({ ...species, quantity: 1 }); // Adiciona a nova espécie com quantidade 1
    }

    renderAquariums(); // Atualiza a renderização dos aquários
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
