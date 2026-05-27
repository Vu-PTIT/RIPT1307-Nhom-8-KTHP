import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as c:
        r = await c.post('http://127.0.0.1:8000/api/v1/auth/login', data={'username':'test123','password':'123456'})
        print('status', r.status_code)
        print('headers', r.headers)
        print('text', r.text)

if __name__ == '__main__':
    asyncio.run(main())
