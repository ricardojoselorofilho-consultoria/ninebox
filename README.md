# RDF Consultoria · Avaliação 360º e Matriz Nine Box

Sistema web para RH e gestores enviarem links de avaliação, acompanharem as respostas e verem a equipe posicionada na Matriz Nine Box.

- **RH**: vê e gerencia toda a empresa.
- **Gestor**: vê os resultados apenas da própria equipe.
- **Colaborador**: não tem login. Responde pelo link pessoal que você envia (WhatsApp, e-mail, Teams…). Cada link vale para uma única avaliação e deixa de funcionar depois de respondido.

Tempo estimado para colocar no ar: **30 a 45 minutos**. Você vai criar três contas gratuitas: Supabase (banco de dados e login), GitHub (guarda os arquivos do site) e Vercel (publica o site).

---

## Passo 1 · Criar o banco no Supabase

1. Acesse **supabase.com**, clique em **Start your project** e entre (pode usar a conta Google).
2. Clique em **New project**.
   - **Name**: `rdf-ninebox`
   - **Database Password**: crie uma senha forte e guarde.
   - **Region**: **South America (São Paulo)**.
   - Clique em **Create new project** e aguarde uns 2 minutos.
3. No menu lateral, abra **SQL Editor** e clique em **New query**.
4. Abra o arquivo `supabase/01_estrutura.sql` (num bloco de notas), copie **todo** o conteúdo, cole no editor e clique em **Run**. Deve aparecer *Success*.
5. Abra `supabase/02_primeiro_acesso.sql`, troque `seu.email@empresa.com.br` e `Seu Nome` pelos seus dados (**e-mail em letras minúsculas**), cole numa nova query e clique em **Run**.
6. *(Opcional)* Para já ver o dashboard com dados de exemplo, rode também `supabase/03_dados_exemplo.sql`. Depois você pode apagar o "Ciclo de exemplo" e as pessoas marcadas como "(exemplo)".
7. Pegue as duas chaves de conexão: clique em **Project Settings** (engrenagem) › **API** (ou no botão **Connect** no topo) e copie:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public key** (ou **Publishable key**, nas versões novas do painel)

   Guarde as duas. A chave *service_role / secret* **não** deve ser usada aqui.

## Passo 2 · Subir os arquivos para o GitHub

1. Crie uma conta em **github.com**.
2. Clique em **New repository** (botão verde ou o **+** no topo).
   - **Repository name**: `rdf-ninebox`
   - Marque **Private**.
   - Clique em **Create repository**.
3. Na página do repositório vazio, clique no link **uploading an existing file**.
4. Descompacte o .zip no seu computador, abra a pasta `ninebox-rdf`, selecione **tudo o que está dentro dela** (as pastas `src`, `public`, `supabase` e os arquivos soltos) e arraste para a página.
   - O arquivo `.gitignore` começa com ponto e pode ficar oculto. Se não aparecer, não tem problema.
5. Clique em **Commit changes**.

## Passo 3 · Publicar na Vercel

1. Acesse **vercel.com** e clique em **Sign Up** › **Continue with GitHub**.
2. Clique em **Add New…** › **Project** e, na lista, clique em **Import** ao lado de `rdf-ninebox`.
3. A Vercel reconhece sozinha que é um projeto **Vite**. Abra **Environment Variables** e cadastre:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | a Project URL do Passo 1.7 |
   | `VITE_SUPABASE_ANON_KEY` | a anon/publishable key do Passo 1.7 |

4. Clique em **Deploy**. Em cerca de 1 minuto aparece o endereço do site, por exemplo `https://rdf-ninebox.vercel.app`. Copie esse endereço.

## Passo 4 · Ligar o login ao endereço do site

De volta ao Supabase:

1. **Authentication** › **URL Configuration**:
   - **Site URL**: o endereço da Vercel (ex.: `https://rdf-ninebox.vercel.app`)
   - **Redirect URLs** › **Add URL**: o mesmo endereço seguido de `/**` (ex.: `https://rdf-ninebox.vercel.app/**`)
   - Clique em **Save**.
2. **Authentication** › **Sign In / Providers** › **Email**: confirme que está **ativado** e que **Confirm email** está ligado.

## Passo 5 · Seu primeiro acesso

1. Abra o endereço do site. Ele leva à tela de login.
2. Clique na aba **Primeiro acesso**, informe o e-mail que você colocou no Passo 1.5 e crie uma senha.
3. Abra o e-mail de confirmação que chegou (veja também o spam) e clique no link. Você entra direto no painel como **RH**.

---

## Como usar no dia a dia

1. **Usuários do painel** *(só RH)*: libere o e-mail de cada gestor (papel *Gestor*) ou de outras pessoas do RH (papel *RH*). Envie a elas o endereço do site e peça que usem **Primeiro acesso**. E-mails fora dessa lista não conseguem criar conta.
2. **Colaboradores**: cadastre a equipe, um por um ou colando uma lista em **Importar lista** (`Nome; e-mail; área; cargo`, uma pessoa por linha). Para cada pessoa, escolha o **gestor responsável**: é ele quem verá os resultados dela.
   - Para um gestor **avaliar** alguém, cadastre-o também como colaborador, com o mesmo e-mail de acesso. Assim o sistema já o sugere como avaliador.
3. **Convites e links** › **Novo ciclo** *(só RH)*: crie o período da avaliação, por exemplo "Ciclo 2º semestre 2026".
4. **Montar avaliação 360º**: escolha quem será avaliado e marque quem avalia: autoavaliação, gestor direto e um ou mais pares. Clique em **Gerar links**.
5. **Links para enviar**: os links aparecem agrupados por quem responde. No cartão da Ana Ribeiro, por exemplo, ficam a autoavaliação dela e a avaliação da Carla Mendes (par). Clique em **Copiar mensagem** e cole no WhatsApp ou e-mail. A mensagem já vem com todos os links pendentes da pessoa.
6. Acompanhe em **Pendentes / Respondidos**. Quem já respondeu ganha um ✓.
7. **Dashboard Nine Box**: KPIs, matriz 3×3 e tabela com o ponto cego, atualizados a cada resposta. O RH pode filtrar por equipe.
8. Ao terminar o período, clique em **Encerrar ciclo**. Os links param de aceitar respostas, mas os resultados continuam no dashboard.

### Regras de cálculo

- **Performance (Y)**: média das perguntas 1 a 10. **Cultura (X)**: média das perguntas 11 a 20.
- **Nota final** = Gestor × 50% + média dos Pares × 30% + Auto × 20%. Se faltar alguma fonte, os pesos restantes são redistribuídos proporcionalmente, e a pessoa aparece como "360º incompleto".
- **Faixas**: Baixo abaixo de 3,0 · Médio de 3,0 a 3,9 · Alto a partir de 4,0.
- **Ponto cego**: a média da autoavaliação fica mais de 1,0 ponto acima da média do gestor.

### Segurança

- As permissões são aplicadas no próprio banco de dados (Row Level Security). Mesmo que alguém altere o site, um gestor não consegue ler respostas de outra equipe, e um visitante sem login não lê nenhuma tabela.
- O colaborador só consegue abrir e responder a avaliação do link que recebeu. Ele não vê notas de ninguém.
- O avaliado não vê quem o avaliou. RH e gestor veem os resultados consolidados por pessoa, não as respostas individuais de cada par.
- Gestores conseguem ver a **lista de nomes** de todos os colaboradores, para poderem escolher pares de outras áreas. Os **resultados**, porém, ficam restritos à equipe de cada gestor.

---

## Bom saber

- **Limite de e-mails do login.** O Supabase gratuito envia poucos e-mails de confirmação e de "esqueci a senha" por hora. Para dezenas de gestores entrando no mesmo dia, configure um SMTP próprio em **Authentication › Emails › SMTP Settings** (Gmail Workspace, Outlook, Resend, Brevo…). Os links de avaliação não usam e-mail do sistema, porque é você quem os envia.
- **E-mails em português.** Em **Authentication › Emails › Templates**, você pode traduzir os textos de confirmação e de redefinição de senha.
- **Projeto pausado.** Projetos gratuitos do Supabase podem ser pausados depois de um tempo sem uso. Se o site parar de carregar dados, entre no Supabase e clique em **Restore project**.
- **Endereço próprio.** Na Vercel, em **Settings › Domains**, você pode usar um endereço como `avaliacao.rdfconsultoria.com.br`. Depois de trocar, atualize também o Passo 4 no Supabase.
- **Alterar o site.** Edite os arquivos no GitHub e faça um commit. A Vercel publica a nova versão sozinha em cerca de 1 minuto.

## Para desenvolvedores

```bash
cp .env.example .env   # preencha com URL e chave do Supabase
npm install
npm run dev            # http://localhost:5173
npm run build
```

Stack: React 18 + Vite + Tailwind CSS + lucide-react + Supabase (Postgres, Auth, RLS, RPC `obter_convite` / `enviar_avaliacao`).
