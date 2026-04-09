---
name: Manual de Boas Práticas - Desenvolvedor Sênior
description: Diretrizes arquiteturais e regras absolutas de desenvolvimento para React, TypeScript e Supabase.
---

# Manual de Boas Práticas: O Guia Definitivo do Desenvolvedor Sênior
Autor: Manus AI

## Prefácio
Este manual transcende a mera coleção de boas práticas; ele é um compêndio de princípios arquiteturais e diretrizes operacionais forjadas na experiência de construção de sistemas complexos e de missão crítica. Destinado a desenvolvedores seniores, líderes técnicos e arquitetos de software, este guia estabelece um padrão de excelência para a concepção, desenvolvimento e manutenção de aplicações robustas, escaláveis e seguras, com foco em ecossistemas modernos como React, TypeScript e Supabase.
Em um cenário onde a velocidade de entrega é crucial, mas a integridade e a segurança são inegociáveis, a adoção de uma arquitetura bem definida e de processos rigorosos torna-se a espinha dorsal do sucesso. Este documento detalha não apenas o que fazer, mas por que certas abordagens são preferíveis, fornecendo exemplos práticos, complementos técnicos e perguntas de revisão que estimulam o pensamento crítico e a autoavaliação contínua.
O objetivo final é capacitar o desenvolvedor sênior a atuar como um verdadeiro arquiteto de soluções, capaz de construir sistemas que não apenas atendam aos requisitos funcionais, mas que também sejam resilientes, seguros e eficientes a longo prazo.

## 1. Arquitetura de Frontend e Componentização: A Arte da Separação de Responsabilidades
A construção de interfaces de usuário modernas exige uma abordagem meticulosa para a organização do código. A arquitetura de frontend deve ser projetada para garantir que cada parte do sistema tenha uma responsabilidade clara e única, promovendo a manutenibilidade, a testabilidade e a escalabilidade. Este princípio, conhecido como Separação de Responsabilidades, é a pedra angular de qualquer sistema frontend robusto.

### 1.1 As Três Camadas Fundamentais do Frontend
O frontend deve ser segmentado em três camadas distintas:
- **Páginas (Pages)** (`src/modules/{modulo}/*.page.tsx`): Orquestram o fluxo, gerenciam o estado global/local e coordenam componentes. Montam a tela e buscam dados via services/hooks. Devem ser "finas" em termo de lógica de apresentação.
- **Componentes de Módulo** (`src/modules/{modulo}/components/`): Encapsulam a lógica de negócio e a apresentação de uma funcionalidade específica dentro do módulo. São componentes "inteligentes".
- **Componentes de UI "Burros"** (`src/lib/ui/`): Fornecem blocos de construção visuais reutilizáveis (botões, inputs), puramente apresentacionais, sem lógica de negócio, recebendo tudo via props.

### 1.2 Regras de Ouro para Componentização
1. **Componentes não fazem chamadas de API:** Devem receber todas as informações necessárias via props ou hooks customizados.
2. **Separação Clara entre Páginas e Componentes:** Páginas atuam como orquestradores (estado da rota, fetch). Componentes focam na interação e apresentação.
3. **Componentes de UI "Burros":** Nenhuma regra de negócio deve residir em `src/lib/ui/`.

### 1.3 Legibilidade e Acessibilidade da Interface
**INPUT_LEGIBILITY:** TODOS os campos de entrada de texto DEVEM ter um fundo claro (ex: #FFFFFF) e cor de fonte escura para máxima legibilidade.

## 2. A Camada de Serviço e Segurança: O Guardião do Backend (Edge Functions do Supabase)
A camada de serviço atua como controlador de acesso ao banco de dados e executa lógica sensível. 

### 2.1 Regras de Ouro
1. **Privilégios Mínimos e Proteção da service_role Key:** A service_role NUNCA deve ser exposta no frontend, devendo residir em Edge Functions seguros.
2. **Abstração por Funcionalidade de Negócio:** Em vez de espelhar CRUD (`GET /lancamentos`), usar funções de negócio (ex: `POST /processar-pagamento`), permitindo transações atômicas seguras no banco.
3. **Validação Agressiva dos Dados:** Validar agressivamente as entradas usando, por exemplo, Zod, para prevenir injection e corrupção.

## 3. Banco de Dados: A Fonte da Verdade e o Guardião da Integridade (PostgreSQL)
A integridade dos dados, com lógica de negócios crítica residindo o mais próximo dos dados.

### 3.1 O Princípio Mestre: A Separação dos Poderes Financeiros
- **O Futuro (As Promessas):** `financial_entries` - O que deveria acontecer (boletos, faturas a receber). Não é dinheiro real.
- **O Presente (A Realidade):** `accounts` - Onde o dinheiro está. O saldo é uma consequência do histórico.
- **O Passado (A Verdade Imutável):** `financial_transactions` - O que já ocorreu. Cada movimento é um fato no livro-razão imutável.

### 3.2 A Função de Negócio (Stored Procedures/RPC)
A lógica crítica com múltiplos registros usa `SECURITY DEFINER` nas RPCs (limitando via auth.uid() apenas às operações daquele usuário). Tudo deve rodar em blocos `BEGIN...COMMIT`.

### 3.3 Regras de Ouro do BD
1. **Saldo Sagrado:** Saldo de conta atualizado SOMENTE dentro do banco/RPC, NUNCA atualizado com valor passado via frontend.
2. **Histórico Imutável:** Transações nunca são deletadas, mas sim recebem transação de Estorno.
3. **Atomicidade:** Modificações de mais de uma tabela devem usar `BEGIN...COMMIT`.

## 4. Multitenancy e Isolamento: A Regra de Ouro do SaaS
Toda tabela de dados deve exigir `organization_id` (a regra inegociável).
- Deve existir `organizations` e `organization_members`.
- Proteção e Isolamento estritamente via Row Level Security (RLS) usando `organization_id` e a junção do token `auth.uid()`.

## 5. Performance, Cache e Realtime
- **Stale-While-Revalidate (SWR):** Obrigatório o uso do TanStack Query.
- **Realtime Seletivo:** Atualizações real-time apenas em tabelas muito críticas. O realtime é o "nervo" para a "visão" (frontend) baseada no "cérebro" (banco). Não criar centenas de subscrições, e todas contêm clean-up na destruição do componente.

## 6. Canonico: Regras de Comportamento e Arquitetura do Desenvolvedor Sênior

### 6.1 Absolute Rules
1. **MINIMAL_SCOPE_MODIFICATION**:
   - NUNCA modifique ou refatore o que não foi pedido pelo usuário explicitamente. Modifique estritamente a função/arquivo solicitado como um cirurgião.
2. **NO_INTERPRETATION** e **NO_ASSUMPTIONS**:
   - Faça apenas as instruções, sem "melhorias" extras. Não presuma existências não fornecidas sem perguntar.
3. **IMMUTABLE_ARCHITECTURE**:
   - Estrutura de pastas sagrada. Nenhuma mudança na responsabilidade dos arquivos.

### 6.2 Estrutura de Pastas e Responsabilidades de Arquivo
```text
src/
├─ lib/
│  └─ supabase.ts
├─ modules/
│  ├─ {modulo}/
│  │  ├─ components/
│  │  │  ├─ {Modulo}List.tsx
│  │  │  ├─ {Modulo}Card.tsx
│  │  │  ├─ {Modulo}FormAdd.tsx
│  │  │  ├─ {Modulo}FormEdit.tsx
│  │  │  ├─ {Modulo}DeleteModal.tsx
│  │  │  └─ {Modulo}Kpis.tsx
│  │  ├─ {modulo}.page.tsx
│  │  ├─ {modulo}.service.ts
│  │  └─ {modulo}.types.ts
```
- `src/lib/supabase.ts` é o único cliente.
- Arquivos `.tsx` são PROIBIDOS de acessar supabase diretamente; tudo passa pelo serviço.
- `id (uuid)`, `user_id (uuid)` e `created_at` em todas as tabelas.

### 6.3 Workflow and Output
- Recebe-se o pedido em natural-language (`CREATE_NEW_MODULE` ou `MODIFY_EXISTING_CODE`).
- Modifique/Crie exatamente na arquitetura.
- Utilize output em block ``typescript e comentários com o fully-path do arquivo a ser criado/alterado.

---
Fim do Manual.
