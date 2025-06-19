import React from "react";
import { Switch, Route, useParams } from "wouter";
import ChecklistList from "@/components/checklists/ChecklistList";
import ChecklistDetails from "@/components/checklists/ChecklistDetails";
import ChecklistForm from "@/components/checklists/ChecklistForm";

export default function Checklists() {
  return (
    <Switch>
      <Route path="/checklists/new">
        <ChecklistForm />
      </Route>
      <Route path="/checklists/edit/:id">
        {(params) => <ChecklistForm checklistId={params.id} />}
      </Route>
      <Route path="/checklists/:id">
        {(params) => <ChecklistDetails checklistId={params.id} />}
      </Route>
      <Route path="/checklists">
        <ChecklistList />
      </Route>
    </Switch>
  );
}