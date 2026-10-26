/* NEEDHEAL - SISTEMA DE LEMBRETES COM ALARME DESPERTADOR E PERFIL */

let usuarios = JSON.parse(localStorage.getItem("nh_usuarios")) || [];
let medicamentos = JSON.parse(localStorage.getItem("nh_medicamentos")) || [];
let historico = JSON.parse(localStorage.getItem("nh_historico")) || [];
let usuarioAtual = localStorage.getItem("nh_usuario") || null;

// Variável para controlar o alarme ativo
let alarmeAtivoIntervalo = null;
let medicamentoAlarmeAtual = null;

// Conta admin padrão
if (!usuarios.some(u => u.nome === "admin")) {
    usuarios.push({
        nome: "admin",
        senha: "admin123",
        admin: true,
        fotoPerfil: ""
    });
    salvarUsuarios();
}

// PERSISTÊNCIA
function salvarUsuarios() {
    localStorage.setItem("nh_usuarios", JSON.stringify(usuarios));
}

function salvarMedicamentos() {
    localStorage.setItem("nh_medicamentos", JSON.stringify(medicamentos));
}

function salvarHistorico() {
    localStorage.setItem("nh_historico", JSON.stringify(historico));
}

// AUXILIARES
function dataHoje() {
    const agora = new Date();
    return agora.toISOString().split("T")[0];
}

function horarioAtual() {
    const agora = new Date();
    return agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

// AUTENTICAÇÃO E ABAS
function alternarAbaAuth(aba) {
    const cadastroBox = document.getElementById("cadastroBox");
    const recuperarBox = document.getElementById("recuperarBox");

    if (aba === 'cadastro') {
        cadastroBox.classList.toggle("hidden");
        recuperarBox.classList.add("hidden");
    } else if (aba === 'recuperar') {
        recuperarBox.classList.toggle("hidden");
        cadastroBox.classList.add("hidden");
    }
}

document.getElementById("cadastroForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("cadastroNome").value.trim();
    const senha = document.getElementById("cadastroSenha").value;

    if (usuarios.some(u => u.nome.toLowerCase() === nome.toLowerCase())) {
        alert("Nome de usuário já cadastrado.");
        return;
    }

    usuarios.push({ nome, senha, admin: false, fotoPerfil: "" });
    salvarUsuarios();

    alert("Conta criada com sucesso.");
    document.getElementById("loginNome").value = nome;
    document.getElementById("loginSenha").value = senha;
    this.reset();
    document.getElementById("cadastroBox").classList.add("hidden");
});

document.getElementById("recuperarForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("recuperarNome").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;
    const usuario = usuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase());

    if (!usuario) {
        alert("Usuário não encontrado.");
        return;
    }

    usuario.senha = novaSenha;
    salvarUsuarios();

    alert("Senha redefinida com sucesso.");
    this.reset();
    document.getElementById("recuperarBox").classList.add("hidden");
});

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const nome = document.getElementById("loginNome").value.trim();
    const senha = document.getElementById("loginSenha").value;

    const usuario = usuarios.find(u => 
        u.nome.toLowerCase() === nome.toLowerCase() && u.senha === senha
    );

    if (!usuario) {
        alert("Credenciais inválidas.");
        return;
    }

    usuarioAtual = usuario.nome;
    localStorage.setItem("nh_usuario", usuarioAtual);
    iniciarSite();
});

function logout() {
    usuarioAtual = null;
    localStorage.removeItem("nh_usuario");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    document.querySelector(".btn-sair").classList.add("hidden");
}

// INICIAR APLICAÇÃO E PERFIL
function iniciarSite() {
    if (!usuarioAtual) return;

    const usuario = usuarios.find(u => u.nome === usuarioAtual);
    if (!usuario) { logout(); return; }

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.querySelector(".btn-sair").classList.remove("hidden");
    document.getElementById("nomeUsuario").textContent = usuario.nome;

    // Atualizar Avatar do Usuário
    const avatarImg = document.getElementById("avatarImg");
    const avatarIniciais = document.getElementById("avatarIniciais");

    if (usuario.fotoPerfil) {
        avatarImg.src = usuario.fotoPerfil;
        avatarImg.classList.remove("hidden");
        avatarIniciais.classList.add("hidden");
    } else {
        avatarImg.classList.add("hidden");
        avatarIniciais.classList.remove("hidden");
        avatarIniciais.textContent = usuario.nome.charAt(0).toUpperCase();
    }

    if (usuario.admin) {
        document.getElementById("adminSection").classList.remove("hidden");
        atualizarUsuariosAdmin();
    } else {
        document.getElementById("adminSection").classList.add("hidden");
    }

    atualizarTela();
}

function meusMedicamentos() {
    return medicamentos.filter(m => m.usuario === usuarioAtual);
}

function meuHistorico() {
    return historico.filter(h => h.usuario === usuarioAtual);
}

// GERENCIAMENTO DO PERFIL (MODAL)
function abrirModalPerfil() {
    document.getElementById("perfilModal").classList.remove("hidden");
}

function fecharModalPerfil() {
    document.getElementById("perfilModal").classList.add("hidden");
    document.getElementById("perfilForm").reset();
}

document.getElementById("perfilForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const usuario = usuarios.find(u => u.nome === usuarioAtual);
    if (!usuario) return;

    const novaSenha = document.getElementById("perfilNovaSenha").value;
    const fotoInput = document.getElementById("perfilFotoInput");

    if (novaSenha) {
        usuario.senha = novaSenha;
    }

    if (fotoInput.files && fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            usuario.fotoPerfil = e.target.result;
            salvarUsuarios();
            fecharModalPerfil();
            iniciarSite();
            alert("Perfil atualizado com sucesso.");
        };
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        salvarUsuarios();
        fecharModalPerfil();
        iniciarSite();
        alert("Perfil atualizado com sucesso.");
    }
});

// FOTO DO MEDICAMENTO
document.getElementById("medFoto").addEventListener("change", function() {
    const arquivo = this.files[0];
    const preview = document.getElementById("previewFoto");

    if (!arquivo) {
        preview.classList.add("hidden");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.classList.remove("hidden");
    };
    reader.readAsDataURL(arquivo);
});

// CADASTRAR MEDICAMENTO
document.getElementById("medicamentoForm").addEventListener("submit", function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;

    const nome = document.getElementById("medNome").value.trim();
    const dosagem = document.getElementById("medDosagem").value.trim();
    const horario = document.getElementById("medHorario").value;
    const frequencia = document.getElementById("medFrequencia").value;
    const preview = document.getElementById("previewFoto");

    const medicamento = {
        id: Date.now().toString(),
        usuario: usuarioAtual,
        nome,
        dosagem,
        horario,
        frequencia,
        foto: preview.classList.contains("hidden") ? "" : preview.src,
        criadoEm: dataHoje()
    };

    medicamentos.push(medicamento);
    salvarMedicamentos();

    this.reset();
    preview.classList.add("hidden");
    preview.src = "";

    atualizarTela();
});

function deveTomarHoje(m) {
    const diaSemana = new Date().getDay();
    if (m.frequencia === "Todos os dias") return true;
    if (m.frequencia === "Segunda a sexta") return diaSemana >= 1 && diaSemana <= 5;
    if (m.frequencia === "Somente uma vez") return m.criadoEm === dataHoje();
    return true;
}

function foiTomadoHoje(id) {
    return meuHistorico().some(h => h.medicamentoId === id && h.data === dataHoje());
}

// ATUALIZAÇÃO DA TELA
function atualizarMedicamentos() {
    const lista = document.getElementById("listaMedicamentos");
    const programados = meusMedicamentos().filter(deveTomarHoje);

    if (programados.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhum medicamento agendado para hoje.</p>';
        return;
    }

    programados.sort((a, b) => a.horario.localeCompare(b.horario));

    lista.innerHTML = programados.map(m => {
        const tomado = foiTomadoHoje(m.id);
        return `
            <article class="medicamento-card">
                ${m.foto ? `<img src="${m.foto}" alt="${escapar(m.nome)}">` : ""}
                <h3>${escapar(m.nome)}</h3>
                <p class="medicamento-info">Dosagem: ${escapar(m.dosagem)}</p>
                <p class="medicamento-info">Frequência: ${escapar(m.frequencia)}</p>
                <span class="badge-horario">Horário: ${escapar(m.horario)}</span>

                ${tomado 
                    ? `<div class="status-concluido">Medicamento administrado</div>` 
                    : `<button class="btn-primary" onclick="marcarTomado('${m.id}')">Confirmar administração</button>`
                }
                
                <button class="btn-danger" onclick="excluirMedicamento('${m.id}')">Excluir</button>
            </article>
        `;
    }).join("");
}

function marcarTomado(id) {
    const med = meusMedicamentos().find(m => m.id === id);
    if (!med) return;

    historico.push({
        id: Date.now().toString(),
        medicamentoId: id,
        usuario: usuarioAtual,
        nome: med.nome,
        dosagem: med.dosagem,
        data: dataHoje(),
        hora: horarioAtual()
    });

    salvarHistorico();
    atualizarTela();
}

function excluirMedicamento(id) {
    if (!confirm("Confirma a exclusão deste medicamento?")) return;

    medicamentos = medicamentos.filter(m => !(m.id === id && m.usuario === usuarioAtual));
    salvarMedicamentos();
    atualizarTela();
}

function atualizarHistorico() {
    const container = document.getElementById("historico");
    const registros = meuHistorico().slice().reverse();

    if (registros.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhum registro no histórico.</p>';
        return;
    }

    container.innerHTML = registros.map(h => `
        <div class="historico-item">
            <div class="historico-detalhes">
                <strong>${escapar(h.nome)} (${escapar(h.dosagem)})</strong>
                <span class="historico-data">Administrado às ${escapar(h.hora)}</span>
            </div>
            <span class="historico-data">${h.data.split("-").reverse().join("/")}</span>
        </div>
    `).join("");
}

function atualizarResumo() {
    const meus = meusMedicamentos();
    const programados = meus.filter(deveTomarHoje);
    const tomados = meuHistorico().filter(h => h.data === dataHoje());

    document.getElementById("totalRemedios").textContent = meus.length;
    document.getElementById("totalHoje").textContent = programados.length;
    document.getElementById("totalTomados").textContent = tomados.length;
}

function atualizarTela() {
    atualizarMedicamentos();
    atualizarHistorico();
    atualizarResumo();
}

// PAINEL ADMINISTRADOR
function atualizarUsuariosAdmin() {
    const lista = document.getElementById("listaUsuarios");
    const usuariosComuns = usuarios.filter(u => !u.admin);

    if (usuariosComuns.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhum usuário cadastrado.</p>';
        return;
    }

    lista.innerHTML = usuariosComuns.map(u => `
        <div class="usuario-item">
            <span>${escapar(u.nome)}</span>
            <button class="btn-danger" onclick="excluirUsuarioAdmin('${escapar(u.nome)}')">Excluir conta</button>
        </div>
    `).join("");
}

function excluirUsuarioAdmin(nome) {
    if (!confirm(`Remover permanentemente a conta de ${nome}?`)) return;

    usuarios = usuarios.filter(u => u.nome !== nome);
    medicamentos = medicamentos.filter(m => m.usuario !== nome);
    historico = historico.filter(h => h.usuario !== nome);

    salvarUsuarios();
    salvarMedicamentos();
    salvarHistorico();

    atualizarUsuariosAdmin();
}

// SISTEMA DE ALARME DESPERTADOR (SOM CONTÍNUO E MODAL BLOQUEANTE)
let audioCtx = null;

function emitirSomDespertador() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = "square";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Tom de alarme

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.error("Áudio bloqueado pelo navegador.");
    }
}

function dispararAlarmeDespertador(med) {
    medicamentoAlarmeAtual = med;
    
    // Atualizar modal
    document.getElementById("alarmeTextoMedicamento").textContent = `Está na hora de tomar: ${med.nome} (${med.dosagem})`;
    
    const fotoContainer = document.getElementById("alarmeFotoContainer");
    const alarmeFoto = document.getElementById("alarmeFoto");
    if (med.foto) {
        alarmeFoto.src = med.foto;
        fotoContainer.classList.remove("hidden");
    } else {
        fotoContainer.classList.add("hidden");
    }

    document.getElementById("alarmeModal").classList.remove("hidden");

    // Tocar o alarme imediatamente e repetir a cada 1 segundo até o usuário desligar
    emitirSomDespertador();
    if (!alarmeAtivoIntervalo) {
        alarmeAtivoIntervalo = setInterval(() => {
            emitirSomDespertador();
        }, 1000);
    }
}

function desligarAlarme() {
    if (alarmeAtivoIntervalo) {
        clearInterval(alarmeAtivoIntervalo);
        alarmeAtivoIntervalo = null;
    }

    document.getElementById("alarmeModal").classList.add("hidden");

    if (medicamentoAlarmeAtual) {
        marcarTomado(medicamentoAlarmeAtual.id);
        medicamentoAlarmeAtual = null;
    }
}

function verificarLembretes() {
    if (!usuarioAtual || alarmeAtivoIntervalo) return; // Se já estiver tocando um alarme, aguarda
    const agora = horarioAtual();

    meusMedicamentos().filter(deveTomarHoje).forEach(m => {
        const chave = `nh_notif_${usuarioAtual}_${m.id}_${dataHoje()}`;

        if (m.horario === agora && !foiTomadoHoje(m.id) && !sessionStorage.getItem(chave)) {
            sessionStorage.setItem(chave, "1");
            dispararAlarmeDespertador(m);
        }
    });
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", function() {
    if (usuarioAtual) {
        iniciarSite();
    } else {
        document.getElementById("loginSection").classList.remove("hidden");
        document.getElementById("app").classList.add("hidden");
    }
});

setInterval(verificarLembretes, 1000);
