<page>
    <actionBar title="Sqlite-access test" />
    <gridLayout rows="auto, *" class="form p-y-2">
        <!-- Add your page content here -->
       <gridLayout row="0" columns="*, auto" rows="auto" backgroundColor="#00389F19">
            <textField col="0" class="nt-input -rounded-sm p-x-4" hint="Name something here" bind:text="{ text }" isEnabled={!loading}></textField>
            <button col="1" text="Add" on:tap="{ addText }" class="-primary" isEnabled={!loading}></button>
       </gridLayout>

        <listView items="{ items }" class="list-group" row='1' on:itemTap="{ remove }">
            <Template let:item>
                <stackLayout class="list-group-item">
                    <label text="{ item._id + '-'+ item.name+ ' -  '+ item.n+ '  - '+ item.i }" class="list-group-item-text" />
                </stackLayout>
            </Template>
        </listView>
        <activityIndicator
            bind:busy="{loading}"
            row="0"
            rowSpan="2"
        />
    </gridLayout>
</page>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Template } from "svelte-native/components"
    import { DbBuilder, IDatabase, DbCreationOptions } from 'nativescript-sqlite-access';
    import { version, databaseName, creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";
    let message: string = "Blank Svelte Native App"
    let text = '';
    let updateCounter = 0;
    let items = [];
    let localDb: IDatabase;
    let onMountCallTwice = false;
    let loading = true;
    
    function init() {
        localDb = DbBuilder(databaseName, <DbCreationOptions>{
            version,
            createTableScriptsFn: () => creationTableQueries,
            dropTableScriptsFn: () => dropTableQueries
        });

        if(loading) {
            reload();
        }
    }

    function addText() {
        let id = localDb.insert(databaseTables.PERSONS, {
            name: text,
            n: 45.5,
            i: 1 * ++updateCounter
        });
        console.log("id", id);
        text = ''
        reload();
    }

    function remove(event) {
        localDb.beginTransact();
        let test = items[event.index];
        let deleted = localDb.delete(databaseTables.PERSONS, '_id=?', [test._id]);
        console.log("deleted count.: ", deleted);
        localDb.commit();
        update();
        reload();
    }

    function update() {
        const updated = localDb.update(databaseTables.PERSONS, {
            name: "updateName-" + (updateCounter++)
        }, "_id=?", [1]);
        console.log("updated:", updated);
    }

    function reload() {
        if (!localDb) return;
        
        const reducerFn = (acc, next) => {
            acc["name"] = acc["name"] || [];
            acc["name"].push(next.name);
            return acc;
        };

        const mapFn = (next) => {
            return next.name;
        };

        console.log("------------- as select and reduce -------------");
        localDb.select(`SELECT * FROM ${databaseTables.PERSONS}`)
        .reduce(reducerFn, {})
        .then(result => {
            console.log("Reducing.: ");
            console.log(result);
        })
        .catch(console.error);

        console.log("------------- as query and map -------------");
        localDb.query({tableName: databaseTables.PERSONS})
        .map(mapFn)
        .then(result => {
            console.log("Mapping.: ");
            console.log(result);
        })
        .catch(console.error);


        console.log("------------- as generator -------------");
        const asGenerator = (localDb as any).queryAsCursor({tableName: databaseTables.PERSONS });
        items = [];
        const id = setInterval(() => {
            const it = asGenerator.next();
            if(it.done) {
                clearInterval(id);
                loading = false;
                return;
            }
            items = [].concat(items, [it.value]);
        }, 1000);
    }
    
    onMount(init);
    onDestroy(() => {
        localDb.close();    
        localDb = null;
    });
</script>
