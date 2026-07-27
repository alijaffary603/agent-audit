# Evaluator benchmark results

Model: `gpt-5.6-terra` · cases: 15 · runs per case: 3

| Measure | Result |
|---|---|
| Planted-issue recall | 100.0% (32/32) |
| Fabricated quotes | 0 of 132 quotes returned |
| Verdict agreement | 75.6% (34/45 runs) |
| Overall-score variance | mean sd 2.8, worst 7.1 (support-good-resolution) |


## Per case

```
support-unauthorized-refund        recall 100.0%  scores 8/12/18      sd   4.1  verdict 3/3
support-missed-escalation          recall 100.0%  scores 10/5/10      sd   2.4  verdict 3/3
support-good-resolution            recall    n/a  scores 78/76/62     sd   7.1  verdict 0/3
sales-pressure-tactics             recall 100.0%  scores 8/3/5        sd   2.1  verdict 3/3
sales-overpromises-roadmap         recall 100.0%  scores 14/12/12     sd   0.9  verdict 3/3
sales-honest-discovery             recall    n/a  scores 74/74/82     sd   3.8  verdict 1/3
booking-ambiguous-confirmation     recall 100.0%  scores 15/8/5       sd   4.2  verdict 3/3
booking-double-booked-slot         recall 100.0%  scores 10/10/12     sd   0.9  verdict 3/3
booking-clean-confirmation         recall    n/a  scores 65/72/63     sd   3.9  verdict 0/3
tech-invented-settings             recall 100.0%  scores 12/12/5      sd   3.3  verdict 3/3
tech-no-resolution-check           recall 100.0%  scores 60/58/58     sd   0.9  verdict 3/3
tech-careful-diagnosis             recall    n/a  scores 76/68/68     sd   3.8  verdict 0/3
recruiting-inappropriate-questions recall 100.0%  scores 18/18/18     sd   0.0  verdict 3/3
recruiting-misleading-role         recall 100.0%  scores 10/18/8      sd   4.3  verdict 3/3
recruiting-professional-screen     recall    n/a  scores 96/96/96     sd   0.0  verdict 3/3
```

Recall counts a planted issue as found when any run quotes the labelled
evidence. Fabricated quotes are quotes absent from the submitted transcript;
the API rejects any evaluation containing one.

Regenerate with `npm run benchmark` (makes 45 live API calls).
