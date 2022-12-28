import { Application, Router, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import * as base64 from "https://deno.land/x/base64@v0.2.1/mod.ts"


const app = new Application();
const router = new Router();

router.get("/api", async (context) => {
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    context.response.body = prepareData(JSON.parse(data));
});

router.post("/api", async (context) => {
    const body = await context.request.body();
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    const json = JSON.parse(data);
    const reqdata = await body.value
    // Add random id
    reqdata.id = Math.floor(Math.random() * 1000000);
    json.push(reqdata);
    await Deno.writeTextFile("data.json", JSON.stringify(json));
    context.response.body = prepareData(json);
})

router.delete("/api/:id", async (context) => {
    const id = context.params.id;
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    const json = JSON.parse(data);
    const filtered = json.filter((item: any) => item.id != id);
    await Deno.writeTextFile("data.json", JSON.stringify(filtered));
    context.response.body = prepareData(filtered);
})

router.patch("/api/:id/:direction", async (context) => {
    const id = context.params.id;
    const direction = context.params.direction;
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    const json: any[] = JSON.parse(data);
    const filtered = json.filter((item: any) => item.id != id);
    const item = json.find((item: any) => item.id == id);
    if (direction == "forward") {
        if (json.indexOf(item) == 0) {
            filtered.splice(json.indexOf(item), 0, item);
        } else {
            filtered.splice(json.indexOf(item) - 1, 0, item);
        }
    } else if (direction == "backward") {
        filtered.splice(json.indexOf(item) + 1, 0, item);
    }
    await Deno.writeTextFile("data.json", JSON.stringify(filtered));
    context.response.body = prepareData(filtered);
})

router.get('/api/:id', async (context) => {
    const id = context.params.id;
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    const json = JSON.parse(data);
    const item = json.find((item: any) => item.id == id);
    context.response.headers.set("Content-Type", "image/png");
    context.response.body = base64.toUint8Array(item.img.split(',')[1]);
})

function prepareData(data: any[]) {
    return data.map((item: any) => {
        item.img = `/api/${item.id}`;
        return item;
    })
}

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
    await send(context, context.request.url.pathname, {
        root: `${Deno.cwd()}/public`,
        index: "index.html",
    });
});

console.log("Server running on http://localhost:8000/");
await app.listen({ port: 8000 });