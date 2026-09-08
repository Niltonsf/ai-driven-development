#!/usr/bin/env python3
"""Regenerates architecture.excalidraw from a single source of truth.

Preserves the hand-drawn ellipses (the Clean Architecture onion) and rebuilds
every panel with generous text metrics so nothing is clipped.
Run: python3 .tools/build_architecture.py
"""
import json, random, time, textwrap, os

RAIZ  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE  = os.path.join(RAIZ, "architecture.excalidraw")
PREFIXO = "07-arquitetura-software-com-ia/projeto-arquitetura"
now = int(time.time() * 1000)

# ---------------------------------------------------------------- métricas
MONO, SANS = 0.685, 0.625          # largura média por caractere, em ems
def med(corpo, size, mono):
    linhas = corpo.split("\n")
    return (max(len(l) for l in linhas) * size * (MONO if mono else SANS),
            len(linhas) * size * 1.25)
def quebra(corpo, size, mono, largura, pre=""):
    lim = max(int((largura - len(pre)*size*(MONO if mono else SANS))
                  / (size*(MONO if mono else SANS))), 16)
    ls = textwrap.wrap(corpo, lim) or [""]
    return "\n".join([pre+ls[0]] + [" "*len(pre)+l for l in ls[1:]])

# ---------------------------------------------------------------- fábricas
BASE = dict(angle=0, fillStyle="solid", strokeWidth=2, strokeStyle="solid",
            roughness=1, opacity=100, groupIds=[], frameId=None, isDeleted=False,
            boundElements=[], updated=now, link=None, locked=False)
TXT  = dict(BASE, roundness=None, containerId=None, lineHeight=1.25,
            autoResize=True, verticalAlign="top", backgroundColor="transparent")
def rid(n=21):
    a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(random.choice(a) for _ in range(n))
def sem(e):
    e.update(seed=random.randint(1,2**31), version=1,
             versionNonce=random.randint(1,2**31)); return e
def txt(x, y, corpo, size, cor="#1e1e1e", mono=True):
    w,h = med(corpo, size, mono)
    return sem(dict(TXT, id=rid(), type="text", index="a0", x=x, y=y, width=w,
                    height=h, text=corpo, originalText=corpo, fontSize=size,
                    fontFamily=3 if mono else 1, textAlign="left", strokeColor=cor))
def cxa(x, y, w, h, traco, fundo="transparent", sw=2, tracejado=False):
    return sem(dict(BASE, id=rid(), type="rectangle", index="a0", x=x, y=y,
                    width=w, height=h, strokeColor=traco, backgroundColor=fundo,
                    strokeWidth=sw, roundness={"type":3},
                    strokeStyle="dashed" if tracejado else "solid"))
def flecha(x, y, dx, dy, cor="#1e1e1e"):
    return sem(dict(BASE, id=rid(), type="arrow", index="a0", x=x, y=y,
                    width=abs(dx), height=abs(dy), strokeColor=cor,
                    backgroundColor="transparent", roundness={"type":2},
                    points=[[0,0],[dx,dy]], lastCommittedPoint=None,
                    startBinding=None, endBinding=None, startArrowhead=None,
                    endArrowhead="arrow", elbowed=False))
def caixa(e):
    if e["type"]=="arrow":
        xs=[e["x"]+p[0] for p in e["points"]]; ys=[e["y"]+p[1] for p in e["points"]]
        return min(xs),min(ys),max(xs),max(ys)
    return e["x"], e["y"], e["x"]+e["width"], e["y"]+e["height"]
def limites(g):
    cs=[caixa(e) for e in g]
    return (min(c[0] for c in cs), min(c[1] for c in cs),
            max(c[2] for c in cs), max(c[3] for c in cs))
def mover(g, dx, dy):
    for e in g: e["x"]+=dx; e["y"]+=dy
    return g

# ---------------------------------------------------------------- conteúdo
INICIO = [
 ("O QUE CONTA COMO \"NEGÓCIO\"?",
  "É a ATIVIDADE, não o formato. SaaS, app e mobile são entrega. Se virasse planilha ou atendente no telefone, o que continuaria igual?",
  "\"SaaS de farmácia\" -> dispensar receita, lote, validade   ·   \"app de finanças\" -> para onde vai o dinheiro"),
 ("QUAL É O NEGÓCIO, ENTÃO?",
  "Em uma frase: que problema real este software resolve, e para quem?",
  "ex: controlar as finanças pessoais de alguém — de onde vem e para onde vai o dinheiro"),
 ("QUE PALAVRAS O NEGÓCIO USA?",
  "Liste o vocabulário ANTES de escrever código; ele vira nome de pasta e de classe.",
  "ex: conta, agencia, instituicao, cartao, fatura, perfil, permissao"),
 ("QUAIS SÃO OS CONTEXTOS?  (módulos)",
  "Agrupe o vocabulário por área com dono e linguagem próprios.",
  "-> modules/auth · modules/contas · modules/cartao   (1 pacote npm cada)"),
 ("QUAIS AGREGADOS EM CADA MÓDULO?",
  "O que é criado e salvo junto? Cada resposta é uma pasta em src/.",
  "-> contas/src/conta · auth/src/usuario · auth/src/perfil"),
 ("QUAIS REGRAS NÃO PODEM SER QUEBRADAS?",
  "As invariantes de cada agregado. São elas que decidem quais VOs existem.",
  "ex: nome de conta 3..80 e único · senha forte · cor em hexadecimal"),
 ("O QUE O USUÁRIO PRECISA FAZER?",
  "Cada intenção do negócio é um caso de uso. Nomeie com o verbo do negócio.",
  "-> salvar-conta · excluir-conta · autenticar · trocar-senha"),
 ("DO QUE O DOMÍNIO PRECISA DE FORA?",
  "Cada necessidade externa é uma porta (interface) declarada em provider/.",
  "-> ContaRepository · ContasPaginadasQuery · NomeContaEmUsoQuery"),
 ("O QUE É BASE TÉCNICA, SEM DOMÍNIO?",
  "O que serviria em qualquer projeto vai para packages/shared, antes dos módulos.",
  "-> Entity · ValueObject · Result · CrudRepository · PaginationDTO"),
 ("SÓ AGORA: QUAL TECNOLOGIA?",
  "Banco, framework e UI se escolhem DEPOIS do domínio — eles são substituíveis.",
  "-> Nest + Prisma + Postgres/Docker · Next + React"),
 ("COMO ISTO CHEGA AO USUÁRIO?",
  "Mapeie o agregado para a tabela, exponha a API, e só então construa a tela.",
  "-> contas.prisma.ts -> contas.controller.ts -> contas.client.ts -> pages/"),
 ("COMO EU PROVO QUE FUNCIONA?",
  "Domínio com mock (sem banco); API por integração.",
  "-> modules/contas/test/mock · apps/backend/.../contas.integration.http"),
]

PERGUNTAS = [
 ("DOMÍNIO", [
  ("O que é o domínio?",
   "O assunto do negócio que o software resolve — contas, cartões, saldo — e as classes que só existem por causa dele."),
  ("Isto é domínio ou não?",
   "Pergunte: se o negócio mudasse de ramo, isso desapareceria? SIM -> modules/. NÃO -> packages/ ou apps/."),
  ("Por que o domínio não pode depender de ninguém?",
   "É a única parte que expressa o negócio; se depender de Prisma ou React, a regra vira detalhe técnico."),
 ]),
 ("MÓDULOS & AGREGADOS", [
  ("Isto é um módulo novo ou um agregado dentro de um módulo existente?",
   "Módulo = contexto de negócio (modules/auth). Agregado = o que é persistido junto (modules/auth/src/perfil)."),
  ("Estas duas entidades ficam no mesmo agregado?",
   "Pergunte: salvo as duas na mesma transação? Sim -> mesmo model/. Não -> agregado próprio."),
  ("Onde coloco um caso de uso que cruza vários agregados?",
   "Na pasta do módulo inteiro: modules/<mod>/src/app/usecases/."),
 ]),
 ("OBJETOS DE VALOR", [
  ("Isto merece um VO ou basta uma string?",
   "Só vira VO se carregar regra de negócio; sem regra, deixe primitivo."),
  ("O que define um VO?",
   "Identidade pelo valor, imutável e autovalidado — tryCreate impede que um inválido exista."),
  ("Zod já valida no backend, ainda preciso do VO?",
   "Sim: Zod valida na borda e devolve primitivo cru; o VO impede a entidade nascer inválida."),
 ]),
 ("CAMADAS — onde o arquivo mora", [
  ("Este arquivo importa Nest, Prisma, React ou Next?",
   "Se importa, não pode viver em modules/ — vai para apps/backend ou apps/web."),
  ("O domínio precisa falar com banco, HTTP ou serviço externo?",
   "Declare a porta (interface) em provider/ e implemente na infra; nunca o contrário."),
  ("Isto é regra de negócio ou detalhe técnico?",
   "Regra -> modules/. Técnico e reusável em qualquer projeto -> packages/shared."),
 ]),
 ("CASOS DE USO & PORTAS", [
  ("Isto é um caso de uso novo ou um método no existente?",
   "Uma intenção de negócio = um caso de uso com um único execute()."),
  ("Preciso de um método novo no repositório?",
   "Se é leitura/consulta, crie uma Query própria (*.query.ts) em vez de inflar o repositório."),
  ("Onde valido a regra: caso de uso ou entidade?",
   "Invariante do próprio dado -> VO/entidade. Regra que depende de outros dados -> caso de uso."),
 ]),
 ("BACKEND & PERSISTÊNCIA", [
  ("Onde mapeio entidade para tabela?",
   "No adaptador apps/backend/src/modules/<mod>/<mod>.prisma.ts; o domínio não conhece Prisma."),
  ("O que a API devolve?", "DTO (dto/*.dto.ts), nunca o agregado."),
 ]),
 ("FRONTEND", [
  ("Onde fica a chamada de API?", "Em data/*.client.ts; componente nunca faz fetch."),
  ("Componente, hook ou página?",
   "Página compõe, hook guarda dados/estado, componente só renderiza."),
 ]),
]

ORDEM = [
 ("REGRA DE NEGÓCIO?",
  "A frase continua verdadeira se eu trocar Prisma, Nest e React?",
  "SIM -> é negócio, vai para modules/       NÃO -> técnico, siga para o 02"),
 ("packages/shared?",
  "É técnico, sem domínio nenhum, e serviria em qualquer outro projeto?",
  "SIM -> packages/shared (base/entity.ts, base/vo.ts, db/*.repository.ts)"),
 ("QUAL MÓDULO?  (Bounded Context)",
  "A que área do negócio isto pertence? Uma área = um pacote npm.",
  "modules/contas · modules/cartao · modules/auth  ->  @arquitetura/contas"),
 ("QUAL AGREGADO?",
  "É salvo na MESMA transação que algo que já existe?",
  "SIM -> entra no agregado existente        NÃO -> agregado novo em src/<agregado>/"),
 ("É A RAIZ DO AGREGADO?",
  "É a única porta de entrada, por onde todo acesso de fora passa?",
  "SIM -> Conta é a raiz; ninguém busca um NomeConta solto no banco"),
 ("É ENTIDADE?",
  "Tem id próprio e muda com o tempo? Duas iguais no conteúdo são diferentes?",
  "SIM -> model/conta.entity.ts — duas contas 'Nubank' são contas distintas"),
 ("É OBJETO DE VALOR?",
  "Vale pelo valor, é imutável E carrega regra? Sem regra, não é VO.",
  "SIM -> model/nome-conta.vo.ts (3..80)     NÃO -> deixe primitivo (string)"),
 ("É INVARIANTE?",
  "É uma verdade que precisa valer a todo instante para o agregado ser válido?",
  "SIM -> proteja no tryCreate(): devolve Result, o inválido nunca nasce"),
 ("É CASO DE USO?",
  "É uma intenção do negócio (salvar, excluir, aprovar)? Um único execute().",
  "SIM -> use-case/salvar-conta.use-case.ts   cruza agregados? -> src/app/usecases/"),
 ("PRECISA DE UMA PORTA?",
  "O domínio precisa de algo do mundo externo (banco, HTTP, e-mail)?",
  "SIM -> declare a interface em provider/, sem citar tecnologia nenhuma"),
 ("A PORTA É REPOSITÓRIO?",
  "Grava e lê o agregado inteiro, falando a língua do domínio?",
  "SIM -> provider/conta.repository.ts extends CrudRepository<Conta>"),
 ("A PORTA É QUERY?",
  "É só leitura e devolve DTO pronto? Então não infle o repositório.",
  "SIM -> provider/contas.query.ts, provider/nome-conta-em-uso.query.ts"),
 ("É ADAPTADOR?",
  "É quem implementa a porta com tecnologia real (banco, HTTP, UI)?",
  "SIM -> apps/backend/.../contas.prisma.ts · apps/web/.../contas.client.ts"),
 ("É DTO?",
  "É o formato que atravessa a fronteira? O agregado nunca sai de casa.",
  "SIM -> dto/conta.dto.ts — o que a API devolve e o formulário envia"),
]

CAMADAS = [
 ("#1971c2","#a5d8ff","INFRAESTRUTURA  ·  anel azul", f"{PREFIXO}/apps/backend/prisma",
  "projeto-arquitetura/\n  apps/\n    backend/\n      prisma/\n        migrations/\n"
  "        models/\n        seed/\n        schema.prisma"),
 ("#2f9e44","#b2f2bb","ADAPTADORES  ·  anel verde", f"{PREFIXO}/apps/backend/src/modules/contas",
  "projeto-arquitetura/\n  apps/\n    backend/src/modules/contas/\n      contas.controller.ts\n"
  "      contas.module.ts\n      contas.prisma.ts   <- implementa ContaRepository\n"
  "    web/src/modules/contas/\n      components/  data/  pages/"),
 ("#e03131","#ffc9c9","CASOS DE USO & PORTAS  ·  anel rosa", f"{PREFIXO}/modules/contas/src/conta",
  "projeto-arquitetura/\n  modules/\n    contas/src/conta/\n      use-case/\n"
  "        salvar-conta.use-case.ts\n        excluir-conta.use-case.ts\n      provider/\n"
  "        conta.repository.ts   <- porta (interface)\n        contas.query.ts\n"
  "        nome-conta-em-uso.query.ts\n      dto/conta.dto.ts"),
 ("#f08c00","#ffec99","ENTIDADES & OBJETOS DE VALOR  ·  núcleo amarelo",
  f"{PREFIXO}/modules/contas/src/conta/model",
  "projeto-arquitetura/\n  modules/\n    contas/src/conta/model/\n"
  "      conta.entity.ts   <- agregado\n      nome-conta.vo.ts\n      descricao-conta.vo.ts\n"
  "      agencia-conta.vo.ts\n      numero-conta.vo.ts\n      instituicao-conta.vo.ts\n"
  "      icone-conta.vo.ts"),
]

LEGENDA = [
 ("#ffec99","Entidades & Objetos de Valor","modules/*/model"),
 ("#ffc9c9","Casos de Uso & Portas","modules/*/use-case, modules/*/provider"),
 ("#b2f2bb","Adaptadores","apps/backend/src/modules, apps/web/src/modules"),
 ("#a5d8ff","Infraestrutura","Nest, Prisma, Next, Postgres, Docker"),
]

SOLID = [
 ("S — Responsabilidade Única",
  "modules/contas/src/conta/use-case/salvar-conta.use-case.ts\n"
  "  -> um caso de uso, um execute(). Sem HTTP, sem SQL.\n"
  "modules/contas/src/conta/model/nome-conta.vo.ts\n"
  "  -> o VO só sabe validar o nome (3..80 caracteres)."),
 ("O — Aberto/Fechado",
  "modules/contas/src/conta/model/nome-conta.vo.ts\n"
  "  class NomeConta extends Text {\n"
  "    protected static override TOO_SHORT = 'NOME_CONTA_TOO_SHORT'\n"
  "    protected static override DEFAULT_MAX_LENGTH = 80\n"
  "  }\n"
  "  -> estende por herança; Text nunca é alterado."),
 ("L — Substituição de Liskov",
  "modules/contas/src/conta/provider/conta.repository.ts\n"
  "  interface ContaRepository extends CrudRepository<Conta> {}\n"
  "  -> Prisma (apps/backend) ou o mock de modules/contas/test/mock\n"
  "     entram no mesmo lugar, sem o caso de uso perceber."),
 ("I — Segregação de Interfaces",
  "packages/shared/src/db/create.repository.ts      create()\n"
  "packages/shared/src/db/update.repository.ts      update()\n"
  "packages/shared/src/db/find-by-id.repository.ts  findById()\n"
  "packages/shared/src/db/delete.repository.ts      delete()\n"
  "  -> 4 interfaces de 1 método, compostas em crud.repository.ts.\n"
  "modules/contas/src/conta/provider/nome-conta-em-uso.query.ts\n"
  "  -> consulta própria em vez de inflar o repositório."),
 ("D — Inversão de Dependência",
  "declara    modules/contas/src/conta/provider/conta.repository.ts\n"
  "implementa apps/backend/src/modules/contas/contas.prisma.ts\n"
  "  -> o núcleo (rosa) define a porta, a infra (verde) obedece.\n"
  "     É isto que faz a seta apontar sempre para dentro."),
]

DDD = [
 ("Agregado / Entidade",
  "modules/contas/src/conta/model/conta.entity.ts\n"
  "  export class Conta extends Entity<Conta, ContaProps>\n"
  "  -> raiz do agregado: guarda os VOs e as regras da conta."),
 ("Objeto de Valor (Value Object)",
  "modules/contas/src/conta/model/*.vo.ts\n"
  "  nome-conta · descricao-conta · agencia-conta · numero-conta\n"
  "  instituicao-conta · icone-conta\n"
  "packages/shared/src/base/vo.ts   equals() / notEquals()\n"
  "  -> imutável e comparado por valor, não por identidade."),
 ("Fábrica (Factory)",
  "modules/contas/src/conta/model/conta.entity.ts\n"
  "  static create(props: ContaProps): Conta\n"
  "  static tryCreate(props: ContaProps): Result<Conta>\n"
  "  -> tryCreate devolve Result; uma Conta inválida nunca nasce."),
 ("Repositório (contrato no domínio)",
  "modules/contas/src/conta/provider/conta.repository.ts\n"
  "modules/contas/src/conta/provider/contas.query.ts\n"
  "  -> persistência descrita na língua do negócio, não do banco."),
 ("Serviço de Aplicação / Caso de Uso",
  "modules/contas/src/conta/use-case/salvar-conta.use-case.ts\n"
  "modules/contas/src/conta/use-case/excluir-conta.use-case.ts\n"
  "  -> orquestram o agregado; uma intenção do negócio cada."),
 ("Contexto Delimitado (Bounded Context)",
  "modules/auth/   modules/cartao/   modules/contas/\n"
  "  -> um pacote npm por contexto: @arquitetura/contas\n"
  "     cada um com seu próprio modelo, sem vazar para o vizinho."),
 ("Linguagem Ubíqua",
  "conta · agencia · instituicao · icone · nome-conta-em-uso\n"
  "  -> o vocabulário do negócio vira nome de arquivo, de classe\n"
  "     e de caso de uso — em português, como o domínio fala."),
 ("DTO na fronteira",
  "modules/contas/src/conta/dto/conta.dto.ts\n"
  "  interface ContaDTO extends ContaProps\n"
  "  -> o que atravessa a borda; o agregado não sai de casa."),
]

# ---------------------------------------------------------------- montagem
LARG   = 1800.0
PAD    = 40.0
CALHA  = 70.0
COL    = (LARG - 2*PAD - CALHA) / 2
CINZA, PALHA = "#495057", "#868e96"

def painel(px, py, titulo, subtitulo, sub2, cor, fundo, blocos, colunas=2):
    """blocos: lista de callables(x, y, largura) -> (elementos, altura)"""
    corpo, ys = [], []
    porcol = (len(blocos) + colunas - 1) // colunas
    topo = py + (92 if sub2 else 76)
    for c in range(colunas):
        fatia = blocos[c*porcol:(c+1)*porcol]
        x, y = px + PAD + c*(COL + CALHA), topo
        for j, f in enumerate(fatia):
            es, h = f(x, y, COL, c*porcol + j + 1)
            corpo += es; y += h
        ys.append(y)
    alt = max(ys) + 24 - py
    cab = [cxa(px, py, LARG, alt, cor, fundo, sw=3),
           txt(px+PAD, py+18, titulo, 20, cor, mono=False),
           txt(px+PAD, py+48, subtitulo, 11, PALHA)]
    if sub2: cab.append(txt(px+PAD, py+66, sub2, 11, "#ced4da"))
    return cab + corpo, alt

def passo(titulo, teste, saida, cor, cor_saida):
    def f(x, y, w, n):
        es = [txt(x, y+2, "%02d" % n, 15, "#ced4da", mono=False),
              txt(x+34, y, titulo, 15, cor, mono=False)]
        yy = y + med(titulo, 15, False)[1] + 5
        bt = quebra(teste, 11, True, w-34)
        es.append(txt(x+34, yy, bt, 11, CINZA)); yy += med(bt,11,True)[1] + 2
        bs = quebra(saida, 11, True, w-34)
        es.append(txt(x+34, yy, bs, 11, cor_saida)); yy += med(bs,11,True)[1] + 15
        return es, yy - y
    return f

def secao(titulo, qas, cor):
    def f(x, y, w, n):
        es = [txt(x, y, titulo, 15, cor, mono=False)]
        yy = y + med(titulo,15,False)[1] + 8
        for q,a in qas:
            bq = quebra(q, 11, True, w, "P: ")
            es.append(txt(x, yy, bq, 11, "#1e1e1e")); yy += med(bq,11,True)[1] + 2
            ba = quebra(a, 11, True, w, "R: ")
            es.append(txt(x, yy, ba, 11, "#2f9e44")); yy += med(ba,11,True)[1] + 14
        return es, yy + 16 - y
    return f

def item(titulo, corpo, cor):
    def f(x, y, w, n):
        es = [txt(x, y, titulo, 15, cor, mono=False)]
        yy = y + med(titulo,15,False)[1] + 5
        es.append(txt(x, yy, corpo, 11, CINZA)); yy += med(corpo,11,True)[1] + 16
        return es, yy - y
    return f

def campo(rotulo, dica):
    """linha da ficha em branco: pergunta + caixa tracejada para preencher"""
    def f(x, y, w, n):
        bt = quebra(rotulo, 12, False, w-34)
        es = [txt(x, y+2, "%02d" % n, 13, "#ced4da", mono=False),
              txt(x+34, y, bt, 12, "#1e1e1e", mono=False)]
        yy = y + med(bt,12,False)[1] + 4
        if dica:
            bd = quebra(dica, 10, True, w-34)
            es.append(txt(x+34, yy, bd, 10, "#adb5bd")); yy += med(bd,10,True)[1] + 4
        es.append(cxa(x+34, yy, w-34, 34, "#ced4da", "#ffffff", sw=1, tracejado=True))
        return es, (yy + 34 + 18) - y
    return f

elementos, y = [], 0.0
CABECA, VAO = 62.0, 170.0
etapas = []

# --- ETAPA 1 -------------------------------------------------------------
es, alt = painel(0, y+CABECA, "INÍCIO DE PROJETO  —  a ordem das primeiras perguntas",
  "Do negócio para a tecnologia, nunca o contrário. Só passe ao seguinte quando o atual tiver resposta.",
  "esquerda 01-06  ->  direita 07-12", "#e8590c", "#fff4e6",
  [passo(t, te, s, "#e8590c", "#0b7285") for t,te,s in INICIO])
etapas.append(("ETAPA 1","ANTES DE ABRIR O EDITOR  ·  entender o negócio","#e8590c",y,es))
y += CABECA + alt + VAO

# --- ETAPA 2 -------------------------------------------------------------
es, alt = painel(0, y+CABECA, "PERGUNTAS  —  pergunte-se ANTES de criar qualquer coisa",
  "Resposta em 1 linha (2 no máximo). Se não couber, a decisão ainda não está clara.",
  None, "#0c8599", "#f8f9fa",
  [secao(t, qas, "#0c8599") for t,qas in PERGUNTAS])
etapas.append(("ETAPA 2","DURANTE O TRABALHO  ·  consulta rápida por área","#0c8599",y,es))
y += CABECA + alt + VAO

# --- ETAPA 3 -------------------------------------------------------------
es, alt = painel(0, y+CABECA, "ORDEM DE DECISÃO  —  leia de cima para baixo, eliminando",
  "Comece no 01 e vá invalidando. O primeiro passo que responder SIM é onde o arquivo mora.",
  "esquerda 01-07  ->  direita 08-14", "#c2255c", "#fff5f7",
  [passo(t, te, s, "#c2255c", "#0b7285") for t,te,s in ORDEM])
etapas.append(("ETAPA 3","AO CRIAR UM ARQUIVO  ·  desça eliminando até o SIM","#c2255c",y,es))
y += CABECA + alt + VAO

# --- ETAPA 4: quadro de arquitetura -------------------------------------
# geometria original desenhada à mão (embutida: o gerador não relê o próprio arquivo)
ANEIS_ORIG = [
 ("ePMIOgNi8RUsXHMTKjCCe", 487.52734375, 148.47265625, 507.125,            "#a5d8ff"),
 ("5ropj0hZh0vG4JmRd3fek", 535.32421875, 199.62304687499991, 408.33984375, "#b2f2bb"),
 ("j_SgCD1PjJa7JteyEEDBu", 603.455078125, 266.904296875, 267.28125,        "#ffc9c9"),
 ("RI32f9uWM4plJyMEsI_Qh", 673.8203125,  335.6484375,  126.828125,         "#ffec99"),
]
elipses = [sem(dict(BASE, id=i, type="ellipse", index="a0", x=x, y=yy, width=d,
                    height=d, strokeColor="#1e1e1e", backgroundColor=cor,
                    roundness={"type":2}))
           for i, x, yy, d, cor in ANEIS_ORIG]
vivas = list(elipses)

arq, ay = [], 0.0
CX_L = 0.0
larg_caixa = 0.0
for traco, fundo, titulo, cam, arvore in CAMADAS:
    larg_caixa = max(larg_caixa,
        max(med(titulo,14,False)[0], med(cam,10,True)[0], med(arvore,12,True)[0]) + 32)
for traco, fundo, titulo, cam, arvore in CAMADAS:
    h = 62 + med(arvore,12,True)[1] + 22
    arq += [cxa(CX_L, ay, larg_caixa, h, traco, fundo),
            txt(CX_L+16, ay+16, titulo, 14, traco, mono=False),
            txt(CX_L+16, ay+40, cam, 10, PALHA),
            txt(CX_L+16, ay+62, arvore, 12)]
    ay += h + 20
arq.insert(0, txt(CX_L, -40, "Camadas no código", 20, "#1e1e1e", mono=False))

# normaliza a posição das elipses (o gerador é idempotente ao reler o arquivo)
lim_elipses = limites(vivas)
alt_e = lim_elipses[3] - lim_elipses[1]
desloca_x = CX_L + larg_caixa + 90 - lim_elipses[0]
desloca_y = (ay - 20 - alt_e) / 2 - lim_elipses[1]
mover(elipses, desloca_x, desloca_y)
arq += elipses                       # <- sem isto os anéis não são emitidos
lim_elipses = limites(vivas)
cxe = lim_elipses[0] + (lim_elipses[2] - lim_elipses[0]) / 2
aneis = sorted(vivas, key=lambda e: -e["width"])
rotulos = ["Infraestrutura","Adaptadores","Casos de Uso","Entidades\n& VOs"]
for i, (e, rot) in enumerate(zip(aneis, rotulos)):
    r = e["width"] / 2
    ce_y = e["y"] + r
    lw, lh = med(rot, 16, False)
    if i + 1 < len(aneis):                      # rótulo na faixa do anel
        r_int = aneis[i+1]["width"] / 2
        ytop = ce_y - r + (r - r_int) / 2 - lh / 2
    else:                                        # núcleo: rótulo no centro
        ytop = ce_y - lh / 2
    arq.append(txt(e["x"] + r - lw / 2, ytop, rot, 16, "#1e1e1e", mono=False))
topo_e = min(e["y"] for e in vivas)
arq.append(txt(cxe - med("Clean Architecture · projeto-arquitetura",20,False)[0]/2,
               topo_e-52, "Clean Architecture · projeto-arquitetura", 20, "#1e1e1e", mono=False))
base_e = max(e["y"]+e["height"] for e in vivas)
arq.append(flecha(cxe, base_e+120, 0, -100))
arq.append(txt(cxe - med("as dependências apontam para dentro",14,False)[0]/2,
               base_e+128, "as dependências apontam para dentro", 14, "#1e1e1e", mono=False))
ex1 = "✔ PERMITIDO — de fora para dentro\n  use-case/salvar-conta.use-case.ts\n  import { Conta } from '../model'"
ex2 = "✖ PROIBIDO — de dentro para fora\n  model/conta.entity.ts\n  import { SalvarContaUseCase } from '../use-case'"
yex = base_e + 175
arq.append(txt(cxe - med("Ex.: a camada amarela nunca importa a rosa",16,False)[0]/2, yex,
               "Ex.: a camada amarela nunca importa a rosa", 16, "#1e1e1e", mono=False))
arq.append(txt(cxe-260, yex+38, ex1, 13, "#2f9e44"))
arq.append(txt(cxe-260, yex+38+med(ex1,13,True)[1]+22, ex2, 13, "#e03131"))

xl = max(caixa(e)[2] for e in vivas) + 90
yl = topo_e + 40
for fundo, nome, caminho in LEGENDA:
    arq += [cxa(xl, yl, 18, 18, "#1e1e1e", fundo),
            txt(xl+30, yl-2, nome+"\n"+caminho, 14, CINZA)]
    yl += med(nome+"\n"+caminho,14,True)[1] + 26
nota = ("DDD → o QUE o núcleo modela (agregados, objetos de valor, casos de uso)\n"
        "SOLID → COMO cada peça é escrita (DIP: o núcleo declara suas portas)\n"
        "Clean Architecture → QUEM pode depender de QUEM (só para dentro)")
arq.append(txt(xl, yl+16, nota, 14, CINZA))

b = limites(arq)
moldura = cxa(b[0]-46, b[1]-46-34, (b[2]-b[0])+92, (b[3]-b[1])+92+34, "#1e1e1e", sw=4)
rot_arq = txt(b[0]-26, b[1]-46-20,
  "projeto-arquitetura  —  CLEAN ARCHITECTURE  (camadas + regra de dependência)",
  18, "#1e1e1e", mono=False)
grupo4 = [moldura, rot_arq] + arq
lb = limites(grupo4); mover(grupo4, -lb[0], (y+CABECA)-lb[1])
etapas.append(("ETAPA 4","O RESULTADO NO CÓDIGO  ·  camadas e regra de dependência",
               "#1e1e1e", y, grupo4))
y += CABECA + (lb[3]-lb[1]) + VAO

# --- ÁREA 5: SOLID + DDD -------------------------------------------------
def bloco_lado(titulo, subtitulo, cor, fundo, itens, px, py, largura):
    corpo, yy = [], py + 56
    for t, c in itens:
        es, h = item(t, c, cor)(px+22, yy, largura-44, 0); corpo += es; yy += h
    alt = yy + 12 - py
    return ([cxa(px, py, largura, alt, cor, fundo, sw=3),
             txt(px+22, py+14, titulo, 20, cor, mono=False),
             txt(px+22, py+38, subtitulo, 11, CINZA)] + corpo), alt

LS = max(med(c,11,True)[0] for _,c in SOLID) + 66
LD = max(med(c,11,True)[0] for _,c in DDD) + 66
g_s, hs = bloco_lado("SOLID","COMO cada peça é escrita  ·  princípios",
                     "#7048e8","#f3f0ff", SOLID, 46, y+CABECA+46, LS)
g_d, hd = bloco_lado("DDD  ·  Domain-Driven Design","O QUE o núcleo modela  ·  padrões de domínio",
                     "#0c8599","#e3fafc", DDD, 46+LS+60, y+CABECA+46, LD)
b5 = limites(g_s+g_d)
grupo5 = [cxa(0, y+CABECA, (b5[2]-0)+46, (b5[3]-(y+CABECA))+46, "#5f3dc4", sw=4)] + g_s + g_d
etapas.append(("ÁREA 5","PRINCÍPIOS & PADRÕES  ·  SOLID (como escrever) e DDD (o que modelar)",
               "#5f3dc4", y, grupo5))
y_final = y + CABECA + (b5[3]-(y+CABECA)) + 46

# --- cabeçalhos do stepper + conectores ---------------------------------
for i,(nome, legenda, cor, ytopo, grupo) in enumerate(etapas):
    elementos += [cxa(0, ytopo, 126, 38, cor, cor, sw=2),
                  txt(18, ytopo+8, nome, 16, "#ffffff", mono=False),
                  txt(142, ytopo+11, legenda, 14, cor, mono=False)] + grupo
    if i < len(etapas)-1:
        elementos.append(flecha(63, etapas[i+1][3]-16, 0, -(VAO-78)))

# --- ÁREA 6: ficha em branco, ao lado -----------------------------------
FICHA = [
 ("Qual é o negócio? (a atividade, não o formato)",
  "não vale \"app\" nem \"SaaS\": o que se FAZ aqui?  ->  guia todas as respostas abaixo"),
 ("Que problema isso resolve, e para quem?",
  "uma frase só, nas palavras do cliente"),
 ("Que palavras vocês usam no dia a dia?",
  "o vocabulário do negócio  ->  vira nome de pasta, de classe e de arquivo"),
 ("Quais são as grandes áreas desse negócio?",
  "ex: cadastro, cobrança, atendimento  ->  modules/<area>"),
 ("Quais são as \"coisas\" que vocês cadastram e acompanham?",
  "ex: conta, cartão, cliente, pedido  ->  agregados e entidades"),
 ("O que é sempre criado e salvo junto?",
  "se eu salvo A, salvo B na mesma hora?  ->  mesmo agregado"),
 ("Que regras nunca podem ser quebradas?",
  "ex: dois clientes não podem ter o mesmo CPF  ->  invariantes e objetos de valor"),
 ("O que as pessoas precisam FAZER no sistema?",
  "liste em verbos: cadastrar, aprovar, cancelar  ->  casos de uso"),
 ("Com que sistemas ou dados de fora isso precisa conversar?",
  "banco, e-mail, ERP, a planilha que já existe  ->  portas em provider/"),
 ("Como vocês vão saber que deu certo?",
  "o critério de pronto, também nas palavras do cliente"),
]

LADO = max(caixa(e)[2] for e in elementos) + 200
es6, alt6 = painel(LADO, CABECA,
  "FICHA DE DESCOBERTA  —  o que perguntar ao cliente",
  "Visão geral do negócio e do domínio. Responda com as palavras do cliente, nunca com termos técnicos.",
  "10 perguntas. O que é técnico se decide depois, nas etapas 2 e 3.",
  "#2b8a3e", "#ffffff", [campo(q, dica) for q, dica in FICHA])
elementos += [cxa(LADO, 0, 126, 38, "#2b8a3e", "#2b8a3e", sw=2),
              txt(LADO+18, 8, "ÁREA 6", 16, "#ffffff", mono=False),
              txt(LADO+142, 11, "FICHA DE DESCOBERTA  ·  o negócio e o domínio, na voz do cliente",
                  14, "#2b8a3e", mono=False)] + es6

# ---------------------------------------------------------------- gravar
A = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
for i,e in enumerate(elementos):
    e["index"] = chr(ord("a") + i//62) + A[i % 62]
doc = {"type":"excalidraw","version":2,"source":"https://excalidraw.com",
       "elements":elementos,
       "appState":{"gridSize":20,"gridStep":5,"gridModeEnabled":False,
                   "viewBackgroundColor":"#ffffff","lockedMultiSelections":{}},
       "files":{}}
json.dump(doc, open(FILE,"w"), indent=2, ensure_ascii=False)
print("elementos:", len(elementos), "| ficha em x =", round(LADO), "| altura total =", round(max(alt6+CABECA, y_final)))
