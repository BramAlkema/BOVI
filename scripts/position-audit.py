#!/usr/bin/env python3
"""
position-audit — enumerate every position of authority in the cast, from the AST.

WHY THIS EXISTS. The canon kept losing track of its own people. Three times in one
audit a load-bearing party turned out to be present everywhere and named nowhere:
the keeper who must invoke every clearing discipline, the bearer that an agentless
"must" requires, and the extractor — the party in a relation who holds discretion
over the other's outcome. Each was invisible for the same reason, and it is not
carelessness:

    A missing FIELD is a compile error. A missing CATEGORY is silence.

Solidity's ontology is capabilities over things: an address may call a function.
It has no type for a duty and no type for a position, so a system can be missing
either one and nothing anywhere will complain. Absence of a thing with no type
produces no signal.

This script supplies the signal. It walks the compiled AST and reports every place
where `msg.sender` is tested against a stored identity — which is what an authority
position looks like once you stop reading prose and start reading structure.

    forge build --ast && python3 scripts/position-audit.py

CALIBRATION, STATED UP FRONT. It over-collects on purpose, which is the right
failure direction for an audit and the wrong one for a gate. It cannot yet tell an
authority from a counterparty: `IndexedObligation.payer`, `ProductiveCredit.borrower` and
`ChallengeBond.asserter` are parties to a relation, not powers over it, and they
appear here anyway. That limitation is the argument for the other half of the work
rather than a defect in this half — structure alone cannot distinguish "A may act
on B" from "A and B are the two sides"; only a declaration can. The checker needs
the type, and the type needs the checker. They are one deliverable, half-built.

WHAT IT IS NOT. It says nothing about whether a position is legitimate, guarded, or
answerable — see docs/JUDGEMENT-REGISTER.md for the classes and their guards. It
finds where power sits. What that power is dressed as is docs/EXTRACTION-AND-THE-MODES.md.
"""

import json, glob, os, collections

def walk(n, fn):
    if isinstance(n, dict):
        fn(n)
        for v in n.values(): walk(v, fn)
    elif isinstance(n, list):
        for v in n: walk(v, fn)

def is_msg_sender(n):
    return (isinstance(n, dict) and n.get('nodeType') == 'MemberAccess'
            and n.get('memberName') == 'sender'
            and n.get('expression', {}).get('name') == 'msg')

gates = collections.defaultdict(set)   # authority: msg.sender must equal / be flagged
reads = collections.defaultdict(set)   # merely indexed by msg.sender

for f in sorted(glob.glob('out/*.sol/*.json')):
    src = os.path.basename(os.path.dirname(f))
    if not os.path.exists(os.path.join('contracts', src)): continue
    ast = json.load(open(f)).get('ast')
    if not ast: continue

    def visit(n):
        nt = n.get('nodeType')
        if nt == 'BinaryOperation' and n.get('operator') in ('==', '!='):
            for a, b in ((n.get('leftExpression'), n.get('rightExpression')),
                         (n.get('rightExpression'), n.get('leftExpression'))):
                if is_msg_sender(a) and isinstance(b, dict):
                    if b.get('nodeType') == 'Identifier':
                        gates[src].add(b['name'])
                    elif b.get('nodeType') == 'MemberAccess':
                        gates[src].add(b.get('memberName'))
        if nt == 'IndexAccess' and is_msg_sender(n.get('indexExpression')):
            base = n.get('baseExpression', {})
            if base.get('nodeType') != 'Identifier': return
            t = (n.get('typeDescriptions') or {}).get('typeString', '')
            (gates if t == 'bool' else reads)[src].add(base['name'] + '[]')

    walk(ast, visit)

print(f"{'contract':<26} {'AUTHORITY POSITIONS':<52} indexed-by-sender")
print('-' * 110)
tot = 0
for src in sorted(set(gates) | set(reads)):
    g = sorted(gates[src]); r = sorted(reads[src]); tot += len(g)
    print(f"{src:<26} {', '.join(g) or '—':<52} {', '.join(r) or '—'}")
print('-' * 110)
print(f"{tot} authority positions across {len(gates)} contracts — none of them a declared type")
