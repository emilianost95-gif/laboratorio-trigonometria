"""Pruebas end-to-end del laboratorio (Playwright + Chromium).
Uso: python3 tests/e2e.py [url] [carpeta_capturas]
"""
import sys, os, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173/index.html'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else 'shots'
os.makedirs(SHOTS, exist_ok=True)
ROUTES = ['inicio'] + [f'm{i}' for i in range(18)] + ['lab', 'desafios', 'cuaderno', 'calculadora', 'progreso']
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail else ''))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto(URL + '#inicio')
    page.wait_for_selector('text=Camino a la trigonometría')
    check('carga inicio', True)
    page.screenshot(path=f'{SHOTS}/01-inicio-desktop.png')

    # --- Bloqueo + modo libre
    page.goto(URL + '#m8'); page.wait_for_timeout(300)
    check('módulo 8 bloqueado al inicio', page.locator('text=Módulo aún bloqueado').count() == 1)
    page.click('text=Activar modo libre'); page.wait_for_timeout(300)
    check('modo libre desbloquea', page.locator('text=Módulo aún bloqueado').count() == 0)

    # --- Recorrer todas las rutas y pestañas
    for r in ROUTES:
        page.goto(URL + '#' + r); page.wait_for_timeout(350)
        broke = page.locator('text=Algo falló en esta sección').count()
        check(f'ruta #{r} renderiza', broke == 0)
        if r.startswith('m') and r != 'm0':
            for tab in ['Profesor', 'Práctica', 'Laboratorio']:
                page.get_by_role('tab', name=tab, exact=True).first.click(); page.wait_for_timeout(250)
                check(f'  #{r} pestaña {tab}', page.locator('text=Algo falló en esta sección').count() == 0)
    page.goto(URL + '#m7'); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/02-pitagoras.png', full_page=False)
    page.click('text=DEMOSTRAR'); page.wait_for_timeout(400)
    for _ in range(2):
        page.click('text=Siguiente →'); page.wait_for_timeout(1700)
    page.locator('#m7-proof').screenshot(path=f'{SHOTS}/03-demostracion.png')
    check('demostración Pitágoras paso 3', page.locator('text=Paso 3 de 5').count() == 1)

    # --- Círculo unitario: valores notables y arrastre
    page.goto(URL + '#m13'); page.wait_for_timeout(400)
    page.get_by_role('button', name='60°', exact=True).click(); page.wait_for_timeout(200)
    txt = page.inner_text('main')
    check('cos 60° = 0,5 en lecturas', '0,5' in txt)
    check('valor exacto √3/2 mostrado para sen 60°', page.locator('.katex .sqrt').count() > 0)
    handle = page.locator('g.drag-handle').first
    box = handle.bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.mouse.down(); page.mouse.move(box['x'] - 250, box['y'] + 200, steps=8); page.mouse.up(); page.wait_for_timeout(200)
    txt2 = page.inner_text('main')
    check('arrastrar P cambia el ángulo', txt2 != txt)
    page.screenshot(path=f'{SHOTS}/04-circulo.png')

    # --- Identidad: verificación masiva
    page.goto(URL + '#m14'); page.wait_for_timeout(300)
    page.click('text=Ejecutar prueba'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('verificación masiva ejecuta 10 000 ángulos', '10.000' in t or '10 000' in t)
    err_line = [l for l in t.split('\n') if 'Mayor error' in l]
    check('error máximo de la identidad < 1e-14', err_line and ('e-16' in err_line[0] or 'e-15' in err_line[0] or ': 0' in err_line[0]), err_line[0] if err_line else '')

    # --- Calculadora DEG/RAD
    page.goto(URL + '#calculadora'); page.wait_for_timeout(300)
    inp = page.get_by_label('Expresión').first
    inp.fill('sin(30)'); inp.press('Enter'); page.wait_for_timeout(150)
    check('DEG: sin(30) = 0,5', '= 0,5' in page.inner_text('main'))
    page.get_by_label('Modo angular: DEG. Pulsa para cambiar').first.click(); page.wait_for_timeout(150)
    inp.fill('sin(30)'); inp.press('Enter'); page.wait_for_timeout(150)
    check('RAD: sin(30) = −0,988…', '= -0,988031624' in page.inner_text('main'))
    inp.fill('asin(0,5)'); inp.press('Enter'); page.wait_for_timeout(150)
    check('RAD: asin(0,5) = π/6 ≈ 0,5236', '= 0,523598775' in page.inner_text('main'))
    page.get_by_label('Modo angular: RAD. Pulsa para cambiar').first.click()
    inp.fill('tan(90)'); inp.press('Enter'); page.wait_for_timeout(150)
    check('DEG: tan(90) avisa no definida', 'no está definida' in page.inner_text('main'))
    inp.fill('sin(37)^2+cos(37)^2'); inp.press('Enter'); page.wait_for_timeout(150)
    check('sin²37 + cos²37 = 1', '= 1' in page.inner_text('main'))

    # --- Ejercicio: respuesta incorrecta → diagnóstico + pista + solución
    page.goto(URL + '#desafios'); page.wait_for_timeout(400)
    page.get_by_label('Tu respuesta').first.fill('99999')
    page.get_by_role('button', name='Comprobar').first.click(); page.wait_for_timeout(250)
    check('error muestra "Revisemos dónde pudo aparecer el error."', page.locator('text=Revisemos dónde pudo aparecer el error.').count() == 1)
    check('se ofrece pista tras el error', page.locator('text=Pista 1').count() == 1)
    page.click('text=Ver solución'); page.wait_for_timeout(250)
    check('solución paso a paso visible', page.locator('text=Solución paso a paso').count() == 1)
    page.screenshot(path=f'{SHOTS}/05-desafio.png')

    # --- Ejercicio de opción múltiple correcto: N1 de pitágoras (se lee la respuesta de la explicación tras errores)
    # Notas y persistencia
    page.goto(URL + '#cuaderno'); page.wait_for_timeout(300)
    page.get_by_placeholder('Título').first.fill('Prueba de persistencia')
    page.locator('textarea').first.fill('Pitágoras: $a^2+b^2=c^2$')
    page.click('text=Agregar al cuaderno'); page.wait_for_timeout(600)
    page.reload(); page.wait_for_timeout(600)
    check('nota persiste tras recargar', page.locator('text=Prueba de persistencia').count() >= 1)
    check('nota renderiza KaTeX', page.locator('article .katex').count() >= 1)
    page.goto(URL + '#progreso'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('progreso registra intentos', 'Precisión' in t)
    st = page.evaluate("JSON.parse(localStorage.getItem('labtrig:state'))")
    check('localStorage guarda modo libre', st['settings']['freeMode'] is True)
    check('localStorage guarda intentos', st['stats']['attempts'] >= 1, f"intentos={st['stats']['attempts']}")
    check('localStorage guarda notas', len(st['notes']) >= 1)

    # --- Datos corruptos no rompen la app (contexto nuevo: el dato corrupto existe ANTES de que cargue la app)
    cctx = b.new_context()
    cctx.add_init_script("if (!sessionStorage.getItem('seeded')) { localStorage.setItem('labtrig:state', '{esto no es json'); sessionStorage.setItem('seeded', '1'); }")
    cp = cctx.new_page(); cp.goto(URL + '#inicio'); cp.wait_for_timeout(600)
    check('JSON corrupto: la app arranca igual', cp.locator('text=Algo falló').count() == 0 and cp.locator('text=Camino a la trigonometría').count() > 0)
    keys = cp.evaluate("Object.keys(localStorage)")
    check('JSON corrupto: se guarda respaldo', any('backup' in k for k in keys), str(keys))
    cctx.close()

    # --- Diagnóstico completo
    page.goto(URL + '#m0'); page.wait_for_timeout(300)
    if page.locator('text=Repetir el diagnóstico').count():
        page.click('text=Repetir el diagnóstico')
    for i in range(14):
        page.locator('main button:has-text("No lo sé")').click() if i % 3 == 0 else page.locator('main .grid button').first.click()
        page.wait_for_timeout(80)
        if i < 13: page.click('text=Siguiente →')
    page.click('text=Ver mi resultado'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('diagnóstico muestra nivel y ruta', 'Nivel estimado' in t and 'Ruta recomendada' in t)
    page.screenshot(path=f'{SHOTS}/06-diagnostico.png')

    # --- Tema oscuro
    page.goto(URL + '#m10'); page.wait_for_timeout(300)
    page.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    page.get_by_role('tab', name='4 · Formalizar').click(); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/07-tangente-oscuro.png')
    bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
    check('modo oscuro cambia el fondo', bg != 'rgb(243, 245, 248)', bg)
    page.goto(URL + '#lab'); page.wait_for_timeout(400)
    page.screenshot(path=f'{SHOTS}/08-lab-libre-oscuro.png')
    page.evaluate("document.documentElement.removeAttribute('data-theme')")

    # --- Responsive: sin scroll horizontal
    for (w, h, tag) in [(390, 844, 'movil'), (820, 1180, 'tablet'), (1280, 800, 'notebook')]:
        mp = ctx.new_page(); mp.set_viewport_size({'width': w, 'height': h})
        bad = []
        for r in ROUTES:
            mp.goto(URL + '#' + r); mp.wait_for_timeout(250)
            sw = mp.evaluate('document.documentElement.scrollWidth')
            if sw > w + 1: bad.append(f'{r}:{sw}')
        check(f'{tag} {w}px: sin desborde horizontal en {len(ROUTES)} rutas', not bad, ', '.join(bad))
        if tag == 'movil':
            for r, n in [('inicio', '09-movil-inicio'), ('m6', '10-movil-triangulo'), ('m12', '11-movil-solver')]:
                mp.goto(URL + '#' + r); mp.wait_for_timeout(300); mp.screenshot(path=f'{SHOTS}/{n}.png', full_page=True)
            mp.goto(URL + '#inicio'); mp.click('[aria-label="Abrir menú"]'); mp.wait_for_timeout(200)
            check('móvil: menú lateral abre', mp.locator('[role=dialog][aria-label="Menú"]').count() == 1)
            mp.screenshot(path=f'{SHOTS}/12-movil-menu.png')
        mp.close()

    real = [e for e in errors if 'fonts.g' not in e and 'net::' not in e]
    check('sin errores de consola', not real, ' | '.join(real[:5]))
    b.close()

fails = [r for r in results if not r[1]]
print(f'\n{len(results) - len(fails)}/{len(results)} pruebas OK')
sys.exit(1 if fails else 0)
