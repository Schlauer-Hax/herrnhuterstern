import { Application, Router, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";

const app = new Application();
const router = new Router();

router.get("/api", async (context) => {
    const data = await Deno.readTextFile("data.json").catch((err) => {
        console.log(err);
        return "[]"
    });
    context.response.body = JSON.parse(data);
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
    context.response.body = json;
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
    context.response.body = filtered;
})

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