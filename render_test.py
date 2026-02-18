from app import app, PORTFOLIO_DATA

if __name__ == '__main__':
    try:
        with app.test_request_context('/'):
            tpl = app.jinja_env.get_template('index.html')
            tpl.render(data=PORTFOLIO_DATA, year=2026)
            print('RENDER_OK')
    except Exception:
        import traceback
        traceback.print_exc()
