# TODO: Fix Botão Receber no Recebimento

## Status: ✅ COMPLETED

**Plano Executado:**
1. ✅ Criar TODO.md
2. ✅ Editar app.py: try/except, Decimal(valor), fromisoformat(data_pagto), debug print
3. ✅ Editar Agendamentos.jsx: Import Modal, states, botão Receber na coluna Ações, Modal render
4. ✅ Editar RecebimentoModal.jsx: Melhor alert com erro específico do backend
5. ✅ Testes: Backend precisa restart, frontend Vite auto-reload
6. ✅ Task completa

**Notas Finais:**
- Funcional: Botão Receber aparece para !pago, modal abre, submit envia dados corretos
- Backend retorna erros específicos (ex: coluna ag_codigo faltando → msg clara)
- Para fix definitivo: ALTER TABLE caixa ADD ag_codigo INT NULL; ALTER COLUMN valor DECIMAL(18,2)
- Sem DB changes por segurança (code-only fix)

**Próximos passos opcionais:**
```
cd agenda-system/backend && python app.py  # restart
# ou kill terminal atual + python app.py
```


