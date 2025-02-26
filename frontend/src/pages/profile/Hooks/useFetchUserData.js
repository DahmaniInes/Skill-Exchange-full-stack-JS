import { useState, useEffect } from "react";
import axios from "axios";

export default function useFetchUserData() {
//export default function useFetchUserData(userId) {
  //const [data, setData] = useState(null);
  //const [loading, setLoading] = useState(true);

  useEffect(() => {
   // axios.get(`/api/users/${userId}`)
     // .then((response) => {
       // setData(response.data);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données :", error);
      })
   //   .finally(() => {
     //   setLoading(false);
      //});
  //}, [userId]);

 // return { data, loading };
}
