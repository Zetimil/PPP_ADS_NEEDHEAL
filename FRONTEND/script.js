
/* NEEDHEAL - SISTEMA DE LEMBRETES */

// Dados salvos no navegador
let usuarios = JSON.parse(localStorage.getItem("nh_usuarios")) || [];
let medicamentos = JSON.parse(localStorage.getItem("nh_medicamentos")) || [];
let historico = JSON.parse(localStorage.getItem("nh_historico")) || [];

let usuarioAtual = localStorage.getItem("nh_usuario") || null;

// Conta de administrador demonstrativa
// Login: admin
// Senha: admin123

if (!usuarios.some(u => u.nome === "admin")) {
    usuarios.push({
        nome: "admin",
        senha: "admin123",
        admin: true
    });

    salvarUsuarios();
}

// SALVAR DADOS
function salvarUsuarios() {
    localStorage.setItem("nh_usuarios", JSON.stringify(usuarios));
}

function salvarMedicamentos() {
    localStorage.setItem("nh_medicamentos",
        JSON.stringify(medicamentos));
}

function salvarHistorico() {
    localStorage.setItem("nh_historico",
        JSON.stringify(historico));
}

// DATA E HORA
function dataHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function horarioAtual() {
    const agora = new Date();

    return agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

// CADASTRO DE USUÁRIO
function mostrarCadastro() {
    document.getElementById("cadastroBox")
        .classList.toggle("hidden");
}

document.getElementById("cadastroForm")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const nome = document.getElementById("cadastroNome")
            .value.trim();

        const senha = document.getElementById("cadastroSenha")
            .value;

        if (usuarios.some(u =>
            u.nome.toLowerCase() === nome.toLowerCase())) {
            alert("Este nome já está cadastrado!");
            return;
        }

        usuarios.push({
            nome: nome,
            senha: senha,
            admin: false
        });

        salvarUsuarios();

        alert("Cadastro realizado com sucesso!");

        document.getElementById("loginNome").value = nome;
        document.getElementById("loginSenha").value = senha;

        document.getElementById("cadastroForm").reset();

        document.getElementById("cadastroBox")
            .classList.add("hidden");
    });

// LOGIN
document.getElementById("loginForm")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const nome = document.getElementById("loginNome")
            .value.trim();

        const senha = document.getElementById("loginSenha")
            .value;

        const usuario = usuarios.find(u =>
            u.nome.toLowerCase() === nome.toLowerCase()
            && u.senha === senha
        );

        if (!usuario) {
            alert("Nome ou senha incorretos!");
            return;
        }

        usuarioAtual = usuario.nome;

        localStorage.setItem("nh_usuario", usuarioAtual);

        iniciarSite();
    });

// SAIR
function logout() {
    usuarioAtual = null;

    localStorage.removeItem("nh_usuario");

    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginSection")
        .classList.remove("hidden");

    document.getElementById("btnSair");
}

// INICIAR SITE
function iniciarSite() {
    if (!usuarioAtual) return;

    const usuario = usuarios.find(u =>
        u.nome === usuarioAtual);

    if (!usuario) {
        logout();
        return;
    }

    document.getElementById("loginSection")
        .classList.add("hidden");

    document.getElementById("app")
        .classList.remove("hidden");

    document.querySelector(".btn-sair")
        .classList.remove("hidden");

    document.getElementById("nomeUsuario")
        .textContent = usuario.nome;

    if (usuario.admin) {
        document.getElementById("adminSection")
            .classList.remove("hidden");
        atualizarUsuarios();
    } else {
        document.getElementById("adminSection")
            .classList.add("hidden");
    }

    atualizarTela();
}

// MEDICAMENTOS DO USUÁRIO ATUAL
function meusMedicamentos() {
    return medicamentos.filter(m =>
        m.usuario === usuarioAtual);
}

function meuHistorico() {
    return historico.filter(h =>
        h.usuario === usuarioAtual);
}

// FOTO DO MEDICAMENTO
document.getElementById("medFoto")
    .addEventListener("change", function() {
        const arquivo = this.files[0];
        const preview = document.getElementById("previewFoto");

        if (!arquivo) {
            preview.classList.add("hidden");
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem.");
            this.value = "";
            return;
        }

        if (arquivo.size > 2 * 1024 * 1024) {
            alert("A foto deve ter no máximo 2 MB.");
            this.value = "";
            return;
        }

        const leitor = new FileReader();

        leitor.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove("hidden");
        };

        leitor.readAsDataURL(arquivo);
    });

// CADASTRAR MEDICAMENTO
document.getElementById("medicamentoForm")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (!usuarioAtual) return;

        const nome = document.getElementById("medNome")
            .value.trim();

        const dosagem = document.getElementById("medDosagem")
            .value.trim();

        const horario = document.getElementById("medHorario")
            .value;

        const frequencia = document.getElementById("medFrequencia")
            .value;

        const foto = document.getElementById("previewFoto");

        const medicamento = {
            id: Date.now().toString(),
            usuario: usuarioAtual,
            nome: nome,
            dosagem: dosagem,
            horario: horario,
            frequencia: frequencia,
            foto: foto.classList.contains("hidden")
                ? ""
                : foto.src,
            criadoEm: dataHoje(),
            ativo: true
        };

        medicamentos.push(medicamento);

        salvarMedicamentos();

        this.reset();
        foto.src = "";
        foto.classList.add("hidden");

        atualizarTela();

        alert("Medicamento cadastrado com sucesso!");
    });

// VERIFICAR SE O MEDICAMENTO DEVE APARECER HOJE
function deveTomarHoje(m) {
    const dia = new Date().getDay();

    if (m.frequencia === "Todos os dias") {
        return true;
    }

    if (m.frequencia === "Segunda a sexta") {
        return dia >= 1 && dia <= 5;
    }

    if (m.frequencia === "Somente uma vez") {
        return m.criadoEm === dataHoje();
    }

    return true;
}

// VERIFICAR SE JÁ FOI TOMADO HOJE
function foiTomadoHoje(id) {
    return meuHistorico().some(h =>
        h.medicamentoId === id &&
        h.data === dataHoje()
    );
}

// EXIBIR MEDICAMENTOS
function atualizarMedicamentos() {
    const lista = document.getElementById("listaMedicamentos");

    const meus = meusMedicamentos().filter(m =>
        deveTomarHoje(m));

    if (meus.length === 0) {
        lista.innerHTML =
            '<p class="vazio">Nenhum medicamento programado para hoje.</p>';
        return;
    }

    // Organiza por horário
    meus.sort((a, b) =>
        a.horario.localeCompare(b.horario));

    lista.innerHTML = meus.map(m => {
        const tomado = foiTomadoHoje(m.id);

        return `
            <article class="medicamento">

                ${m.foto
                    ? `<img src="${m.foto}" alt="Foto de ${escapar(m.nome)}">`
                    : ""
                }

                <h3>${escapar(m.nome)}</h3>

                <p><strong>Dosagem:</strong>
                    ${escapar(m.dosagem)}</p>

                <p><strong>Frequência:</strong>
                    ${escapar(m.frequencia)}</p>

                <div class="horario">
                    ⏰ ${escapar(m.horario)}
                </div>

                ${tomado
                    ? `<div class="status-tomado">
                        ✓ Medicamento tomado hoje
                       </div>`
                    : `<button class="btn-tomado"
                        onclick="marcarTomado('${m.id}')">
                        ✓ Já tomei este medicamento
                       </button>`
                }

                <button class="btn-excluir"
                    onclick="excluirMedicamento('${m.id}')">
                    Excluir medicamento
                </button>

            </article>
        `;
    }).join("");
}

// MARCAR MEDICAMENTO COMO TOMADO
function marcarTomado(id) {
    const medicamento = meusMedicamentos()
        .find(m => m.id === id);

    if (!medicamento) return;

    if (foiTomadoHoje(id)) {
        alert("Este medicamento já foi marcado como tomado hoje.");
        return;
    }

    const confirmar = confirm(
        `Você tomou ${medicamento.nome} (${medicamento.dosagem})?`
    );

    if (!confirmar) return;

    historico.push({
        id: Date.now().toString(),
        medicamentoId: id,
        usuario: usuarioAtual,
        nome: medicamento.nome,
        dosagem: medicamento.dosagem,
        data: dataHoje(),
        hora: horarioAtual()
    });

    salvarHistorico();
    atualizarTela();
}

// EXCLUIR MEDICAMENTO
function excluirMedicamento(id) {
    const confirmar = confirm(
        "Deseja realmente excluir este medicamento?"
    );

    if (!confirmar) return;

    medicamentos = medicamentos.filter(m =>
        !(m.id === id && m.usuario === usuarioAtual));

    salvarMedicamentos();
    atualizarTela();
}

// HISTÓRICO
function atualizarHistorico() {
    const elemento = document.getElementById("historico");

    const meus = meuHistorico().slice().reverse();

    if (meus.length === 0) {
        elemento.innerHTML =
            '<p class="vazio">Nenhum medicamento tomado ainda.</p>';
        return;
    }

    elemento.innerHTML = meus.map(h => `
        <div class="historico-item">
            <strong>✓ ${escapar(h.nome)}</strong>
            <p>Dosagem: ${escapar(h.dosagem)}</p>
            <p>Data: ${h.data.split("-").reverse().join("/")}</p>
            <p>Horário tomado: ${escapar(h.hora)}</p>
        </div>
    `).join("");
}

// RESUMO
function atualizarResumo() {
    const meus = meusMedicamentos();

    const programados = meus.filter(m =>
        deveTomarHoje(m));

    const tomados = meuHistorico().filter(h =>
        h.data === dataHoje());

    document.getElementById("totalRemedios")
        .textContent = meus.length;

    document.getElementById("totalHoje")
        .textContent = programados.length;

    document.getElementById("totalTomados")
        .textContent = tomados.length;
}

// ATUALIZAR TODA A TELA
function atualizarTela() {
    atualizarMedicamentos();
    atualizarHistorico();
    atualizarResumo();
}

// NOTIFICAÇÕES
async function ativarNotificacoes() {
    if (!("Notification" in window)) {
        alert("Seu navegador não suporta notificações.");
        return;
    }

    if (!("serviceWorker" in navigator)) {
        alert("Para notificações em segundo plano, será necessário configurar um servidor e um service worker.");
    }

    const permissao = await Notification.requestPermission();

    if (permissao === "granted") {
        alert("Notificações ativadas! Mantenha o site aberto para receber os lembretes.");
        verificarLembretes();
    } else {
        alert("Permita as notificações nas configurações do navegador.");
    }
}

// VERIFICAR HORÁRIOS
function verificarLembretes() {
    if (!usuarioAtual) return;

    const agora = horarioAtual();

    meusMedicamentos()
        .filter(m => deveTomarHoje(m))
        .forEach(m => {
            const chave = `nh_aviso_${usuarioAtual}_${m.id}_${dataHoje()}`;

            if (m.horario === agora &&
                !foiTomadoHoje(m.id) &&
                !sessionStorage.getItem(chave)) {

// Tocar som do alerta
tocarAlerta();

// Mostrar notificação
if ("Notification" in window &&
    Notification.permission === "granted") {

    new Notification("NEEDHEAL - Hora do remédio!", {
        body: `Está na hora de tomar ${m.nome} (${m.dosagem}).`,
        icon: m.foto || undefined
    });
}

                sessionStorage.setItem(chave, "1");
            }
        });
}

// PAINEL ADMINISTRATIVO
function atualizarUsuarios() {
    const lista = document.getElementById("listaUsuarios");

    const comuns = usuarios.filter(u => !u.admin);

    if (comuns.length === 0) {
        lista.innerHTML =
            '<p class="vazio">Nenhum usuário cadastrado.</p>';
        return;
    }

    lista.innerHTML = comuns.map(u => `
        <div class="usuario-item">
            <strong>👤 ${escapar(u.nome)}</strong>

            <button onclick="excluirUsuario('${escapar(u.nome)}')">
                Excluir usuário
            </button>
        </div>
    `).join("");
}

// EXCLUIR USUÁRIO PELO ADMIN
function excluirUsuario(nome) {
    const usuario = usuarios.find(u =>
        u.nome === nome && !u.admin);

    if (!usuario) return;

    if (!confirm(`Deseja excluir o usuário ${nome} e seus dados?`)) {
        return;
    }

    usuarios = usuarios.filter(u => u.nome !== nome);

    medicamentos = medicamentos.filter(m =>
        m.usuario !== nome);

    historico = historico.filter(h =>
        h.usuario !== nome);

    salvarUsuarios();
    salvarMedicamentos();
    salvarHistorico();

    atualizarUsuarios();

    alert("Usuário excluído com sucesso!");
}

/* SOM DO ALERTA NEEDHEAL */

let audioContext = null;

// Ativar o áudio após interação do usuário
function prepararAudio() {
    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

// Tocar som do lembrete
function tocarAlerta() {
    prepararAudio();

    const frequencias = [880, 660, 880];

    frequencias.forEach((frequencia, index) => {
        const oscilador = audioContext.createOscillator();
        const volume = audioContext.createGain();

        oscilador.connect(volume);
        volume.connect(audioContext.destination);

        oscilador.type = "sine";
        oscilador.frequency.value = frequencia;

        const inicio = audioContext.currentTime + index * 0.35;

        volume.gain.setValueAtTime(0.001, inicio);
        volume.gain.exponentialRampToValueAtTime(
            0.5, inicio + 0.05
        );
        volume.gain.exponentialRampToValueAtTime(
            0.001, inicio + 0.3
        );

        oscilador.start(inicio);
        oscilador.stop(inicio + 0.3);
    });
}

// Preparar áudio quando o usuário interagir
document.addEventListener("click", prepararAudio);
document.addEventListener("keydown", prepararAudio);



// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".btn-sair")
        .classList.toggle("hidden", !usuarioAtual);

    if (usuarioAtual) {
        iniciarSite();
    } else {
        document.getElementById("loginSection")
            .classList.remove("hidden");

        document.getElementById("app")
            .classList.add("hidden");
    }
});

// VERIFICA OS LEMBRETES A CADA SEGUNDO
setInterval(verificarLembretes, 1000);