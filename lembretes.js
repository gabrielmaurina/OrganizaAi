// === LEMBRETES ===

// Carrega os lembretes ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
  carregarLembretes();
});

function adicionarLembrete() {
  const input = document.getElementById('lembreteInput');
  const texto = input.value.trim();

  if (texto === '') {
    alert('Digite um lembrete antes de adicionar.');
    return;
  }

  // Recupera lembretes existentes do localStorage
  const lembretes = JSON.parse(localStorage.getItem('lembretes')) || [];

  // Adiciona o novo lembrete
  lembretes.push(texto);

  // Salva novamente
  localStorage.setItem('lembretes', JSON.stringify(lembretes));

  // Atualiza a lista na tela
  renderizarLembretes();

  // Limpa o campo de texto
  input.value = '';
}

function renderizarLembretes() {
  const lista = document.getElementById('listaLembretes');
  lista.innerHTML = '';

  const lembretes = JSON.parse(localStorage.getItem('lembretes')) || [];

  lembretes.forEach((lembrete, index) => {
    const li = document.createElement('li');
    li.textContent = lembrete;

    // Botão para remover lembrete
    const btnRemover = document.createElement('button');
    btnRemover.textContent = 'X';
    btnRemover.style.marginLeft = '10px';
    btnRemover.onclick = () => removerLembrete(index);

    li.appendChild(btnRemover);
    lista.appendChild(li);
  });
}

function removerLembrete(index) {
  const lembretes = JSON.parse(localStorage.getItem('lembretes')) || [];
  lembretes.splice(index, 1);
  localStorage.setItem('lembretes', JSON.stringify(lembretes));
  renderizarLembretes();
}

function carregarLembretes() {
  renderizarLembretes();
}