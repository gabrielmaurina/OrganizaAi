// Selecionar elementos
const form = document.getElementById("form-tarefa");
const tabela = document.getElementById("lista-tarefas");

// Evento do formulário
form.addEventListener("submit", function(event) {
    event.preventDefault(); // impede recarregamento da página

    // pega os valores
    const data = document.getElementById("data").value;
    const materia = document.getElementById("materia").value;
    const descricao = document.getElementById("descricao").value;
    const status = document.getElementById("status").value;

    // cria nova linha
    const novaLinha = document.createElement("tr");

    novaLinha.innerHTML = `
        <td>${data}</td>
        <td>${materia}</td>
        <td>${descricao}</td>
        <td>${status}</td>  
    `;

    // adiciona na tabela
    tabela.appendChild(novaLinha);

    // limpa campos do formulário
    form.reset();
});
