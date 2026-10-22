import "server-only"

// Referências oficiais consultadas em 22/10/2026:
// INSS: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
// IRRF: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/tabelas-do-imposto-de-renda/
export const PAYROLL_TABLES_REFERENCE = `TABELAS INTERNAS OFICIAIS PARA CONFERÊNCIA

INSS do empregado, doméstico e trabalhador avulso (cálculo progressivo por faixa):
- 01/2023 a 04/2023: até 1.302,00 = 7,5%; 1.302,01–2.571,29 = 9%; 2.571,30–3.856,94 = 12%; 3.856,95–7.507,49 = 14%.
- 05/2023 a 12/2023: até 1.320,00 = 7,5%; 1.320,01–2.571,29 = 9%; 2.571,30–3.856,94 = 12%; 3.856,95–7.507,49 = 14%.
- 01/2024 a 12/2024: até 1.412,00 = 7,5%; 1.412,01–2.666,68 = 9%; 2.666,69–4.000,03 = 12%; 4.000,04–7.786,02 = 14%.
- 01/2025 a 12/2025: até 1.518,00 = 7,5%; 1.518,01–2.793,88 = 9%; 2.793,89–4.190,83 = 12%; 4.190,84–8.157,41 = 14%.
- A partir de 01/2026: até 1.621,00 = 7,5%; 1.621,01–2.902,84 = 9%; 2.902,85–4.354,27 = 12%; 4.354,28–8.475,55 = 14%.
Décimo terceiro usa cálculo separado da remuneração mensal. Havendo múltiplos vínculos, a tabela isolada pode não bastar.

IRRF mensal (aplique alíquota sobre a base de cálculo e subtraia a parcela a deduzir):
- 01/2023 a 04/2023: até 1.903,98 = isento; até 2.826,65 = 7,5% e dedução 142,80; até 3.751,05 = 15% e dedução 354,80; até 4.664,68 = 22,5% e dedução 636,13; acima = 27,5% e dedução 869,36. Dependente: 189,59.
- 05/2023 a 01/2024: até 2.112,00 = isento; até 2.826,65 = 7,5% e dedução 158,40; até 3.751,05 = 15% e dedução 370,40; até 4.664,68 = 22,5% e dedução 651,73; acima = 27,5% e dedução 884,96. Dependente: 189,59; simplificado: 528,00.
- 02/2024 a 04/2025: até 2.259,20 = isento; até 2.826,65 = 7,5% e dedução 169,44; até 3.751,05 = 15% e dedução 381,44; até 4.664,68 = 22,5% e dedução 662,77; acima = 27,5% e dedução 896,00. Dependente: 189,59; simplificado: 564,80.
- 05/2025 a 12/2025: até 2.428,80 = isento; até 2.826,65 = 7,5% e dedução 182,16; até 3.751,05 = 15% e dedução 394,16; até 4.664,68 = 22,5% e dedução 675,49; acima = 27,5% e dedução 908,73. Dependente: 189,59; simplificado: 607,20.
- A partir de 01/2026: a mesma tabela-base de 05/2025, mais redução mensal: rendimentos tributáveis até 5.000,00 têm redução limitada ao imposto, zerando-o; de 5.000,01 a 7.350,00, redução = 978,62 - (0,133145 x rendimentos tributáveis); acima de 7.350,00, sem redução. Dependente: 189,59; simplificado: 607,20.

Use a competência do documento, não a data da análise. Se a competência estiver entre 2023 e 2026 e a base estiver legível, use estas tabelas e mostre cada faixa do INSS. Para IRRF, informe também as deduções consideradas. Não crie pendência dizendo que falta tabela nesses períodos; pergunte apenas pelas bases/deduções realmente ausentes. Para outros anos, não invente tabela.`

