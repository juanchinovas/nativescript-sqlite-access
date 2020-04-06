<template>
    <Page class="page">
        <ActionBar class="action-bar">
            <Label class="action-bar-title" text="Testing"></Label>
        </ActionBar>

        <GridLayout rows="auto, auto, *" class="form p-y-2">
            <!-- Add your page content here -->
            <GridLayout row="0" columns="*, auto" rows="*" class="p-8" backgroundColor="#f0f0f0">
                <TextField col="0" class="input input-rounded" :hint="hint"  v-model="text" backgroundColor="#fff"></TextField>
                <Button col="1" text="Add" @tap="addText" class="btn btn-primary"></Button>
            </GridLayout>

            <ListView for="item in items" class="list-group" row='2' @itemTap="remove">
                <v-template>
                    <StackLayout class="list-group-item">
                        <Label :text="item._id + '-' + item.name + ' -  ' + item.n + '  - ' + item.i" class="list-group-item-text"></Label>
                    </StackLayout>
                </v-template>
            </ListView>
        </GridLayout>
    </Page>
</template>

<script>

    import { DbBuilder } from 'nativescript-sqlite-access';
    import { databaseName, creationTableQueries, dropTableQueries, databaseTables } from "../db-setting";

    export default {
        data: function () {
            return {
                db: null,
                updateCounter: 0,
                items: [],
                hint: "Name something here",
                text: ""
            }
        },
        created: function () {
           this.db = DbBuilder(databaseName, {
                version: 1,
                createTableScriptsFn: () => {
                    return creationTableQueries;
                },
                dropTableScriptsFn: () => {
                    return dropTableQueries;
                }
            });
            this.reload();
        },
        methods: {
            addText: function () {
                let id = this.db.insert(databaseTables.PERSONS, {
                    name: this.text,
                    n: 45.23,
                    i: 1 * ++this.updateCounter
                });
                this.text = '';
                this.reload();
            },
            remove: function (event) {
                this.db.beginTransact();
                let test = this.items[event.index];
                let deleted = this.db.delete(databaseTables.PERSONS, '_id=?', [test._id]);
                console.log("deleted count.: ", deleted);
                this.db.commit();
                this.update();
                this.reload();
            },
            update: function () {
                const updated = this.db.update(databaseTables.PERSONS, {
                    name: "updateName-" + (this.updateCounter++)
                }, "_id=?", [1]);
                console.log("updated:", updated);
            },
            reload: function () {
                this.db.select(`SELECT * FROM ${databaseTables.PERSONS}`, null).then(result => {
                    this.items = result;
                })
                .catch(err => {
                    console.log(err);
                    console.log("jajaja");
                });

                const reducerFn = (acc, next) => {
                    acc["name"] = acc["name"] || [];
                    acc["name"].push(next.name);
                    return acc;
                };

                this.db.select(`SELECT * FROM ${databaseTables.PERSONS}`, null, reducerFn).then(result => {
                    console.log(result);
                })
                .catch(console.error);
            }
        }
    };
</script>