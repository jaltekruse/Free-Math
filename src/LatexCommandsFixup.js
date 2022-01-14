var commandsLookup =
{"∐":"\\amalg ","√":"\\surd ","→":"\\rightarrow ","∉":"\\notin","≅":"\\cong","≡":"\\equiv","⊕":"\\bigoplus ","⊗":"\\bigotimes ","≠":"\\ne ","∗":"\\ast ","∴":"\\therefore ","∵":"\\because ","∝":"\\propto ","≈":"\\approx ","∈":"\\in ","∋":"\\ni ","∌":"\\not\\ni ","⊂":"\\subset ","⊃":"\\supset ","⊄":"\\not\\subset ","⊅":"\\not\\supset ","⊆":"\\subseteq ","⊇":"\\supseteq ","⊈":"\\not\\subseteq ","⊉":"\\not\\supseteq ","ℕ":"\\mathbb{N}","ℙ":"\\mathbb{P}","ℤ":"\\mathbb{Z}","ℚ":"\\mathbb{Q}","ℝ":"\\mathbb{R}","ℂ":"\\mathbb{C}","ℍ":"\\mathbb{H}","◇":"\\diamond ","△":"\\triangle ","⊖":"\\ominus ","⊎":"\\biguplus ","▽":"\\bigtriangledown ","⊓":"\\sqcap ","⊲":"\\triangleleft ","⊔":"\\bigsqcup ","⊳":"\\triangleright ","⊙":"\\bigodot ","◯":"\\bigcirc ","†":"\\dagger ","‡":"\\ddagger ","≀":"\\wr ","⊨":"\\models ","≺":"\\prec ","≻":"\\succ ","≼":"\\preceq ","≽":"\\succeq ","≃":"\\simeq ","∣":"\\mid ","≪":"\\ll ","≫":"\\gg ","∥":"\\parallel ","∦":"\\nparallel ","⋈":"\\bowtie ","⊏":"\\sqsubset ","⊐":"\\sqsupset ","⌣":"\\smile ","⊑":"\\sqsubseteq ","⊒":"\\sqsupseteq ","≐":"\\doteq ","⌢":"\\frown ","⊦":"\\vdash ","⊣":"\\dashv ","≮":"\\nless ","≯":"\\ngtr ","←":"\\leftarrow ","⇐":"\\Leftarrow ","⇒":"\\Rightarrow ","↔":"\\leftrightarrow ","↕":"\\updownarrow ","⇔":"\\Leftrightarrow ","⇕":"\\Updownarrow ","↦":"\\mapsto ","↗":"\\nearrow ","↩":"\\hookleftarrow ","↪":"\\hookrightarrow ","↘":"\\searrow ","↼":"\\leftharpoonup ","⇀":"\\rightharpoonup ","↙":"\\swarrow ","↽":"\\leftharpoondown ","⇁":"\\rightharpoondown ","↖":"\\nwarrow ","…":"\\dots ","⋯":"\\cdots ","⋮":"\\vdots ","⋱":"\\ddots ","ℓ":"\\ell ","⊤":"\\top ","♭":"\\flat ","♮":"\\natural ","♯":"\\sharp ","℘":"\\wp ","⊥":"\\perp ","♣":"\\clubsuit ","♢":"\\diamondsuit ","♡":"\\heartsuit ","♠":"\\spadesuit ","▱":"\\parallelogram ","⬜":"\\square ","∮":"\\oint ","∩":"\\cap ","∪":"\\cup ","∨":"\\vee ","∧":"\\wedge ","⌊":"\\lfloor ","⌋":"\\rfloor ","⌈":"\\lceil ","⌉":"\\rceil ","∇":"\\nabla ","ℏ":"\\hbar ","Å":"\\AA ","∘":"\\circ ","•":"\\bullet ","∖":"\\setminus ","¬":"\\neg ","↓":"\\downarrow ","⇓":"\\Downarrow ","↑":"\\uparrow ","⇑":"\\Uparrow ","ℜ":"\\Re ","ℑ":"\\Im ","∂":"\\partial ","∞":"\\infty ","£":"\\pounds ","ℵ":"\\aleph ","∃":"\\exists ","∄":"\\nexists ","∅":"\\varnothing ","°":"\\degree ","∠":"\\angle ","∡":"\\measuredangle "," ":"\\ ","′":"'","″":"″","α":"\\alpha","β":"\\beta","γ":"\\gamma","δ":"\\delta","ζ":"\\zeta","η":"\\eta","θ":"\\theta","ι":"\\iota","κ":"\\kappa","μ":"\\mu","ν":"\\nu","ξ":"\\xi","ρ":"\\rho","σ":"\\sigma","τ":"\\tau","χ":"\\chi","ψ":"\\psi","ω":"\\omega","ϕ":"\\phi ","φ":"\\varphi ","ϵ":"\\epsilon ","ε":"\\varepsilon ","ϖ":"\\varpi ","ς":"\\varsigma ","ϑ":"\\vartheta ","υ":"\\upsilon ","ϝ":"\\digamma ","ϰ":"\\varkappa ","ϱ":"\\varrho ","π":"\\pi ","λ":"\\lambda ","ϒ":"\\Upsilon ","Γ":"\\Gamma","Δ":"\\Delta","Θ":"\\Theta","Λ":"\\Lambda","Ξ":"\\Xi","Π":"\\Pi","Σ":"\\Sigma","Φ":"\\Phi","Ψ":"\\Psi","Ω":"\\Omega","∀":"\\forall","−":"-","±":"\\pm ","∓":"\\mp ","·":"\\cdot ","<":"<",">":">","≤":"\\le ","≥":"\\ge ","×":"\\times ","÷":"\\div "};

var commandsLookupRegexes = {};
Object.keys(commandsLookup).map(function(key, index) {
  commandsLookupRegexes[commandsLookup[key]] = new RegExp(key, 'g');
});

function replaceSpecialCharsWithLatex(str) {
    for (let cmd in commandsLookupRegexes) {
        if (commandsLookupRegexes.hasOwnProperty(cmd)) {
            str = str.replace(commandsLookupRegexes[cmd], cmd);
        }
    }
    return str;
}

export { replaceSpecialCharsWithLatex as default }
